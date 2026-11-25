import asyncio
import logging
import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.exceptions import TooManyRequestsError
from app.database.session import async_session_maker
from app.domain.activities.models import Activity
from app.domain.coordenadorias.models import Coordenadoria
from app.domain.projects.concession_parser import parse_concession_sheet
from app.domain.projects.google_sheets_client import (
    GoogleSheetsClient,
    SheetReaderPort,
    extract_spreadsheet_id,
)
from app.domain.projects.models import Project, SyncLog

logger = logging.getLogger("Gestão de Projetos")

MANUAL_SYNC_COOLDOWN_SECONDS = 60
TARGET_CONCESSION_SHEET = "Concessão"

_sync_lock = asyncio.Lock()


def build_google_sheets_client() -> GoogleSheetsClient:
    """Fábrica padrão do Adapter de leitura do Google Sheets."""
    return GoogleSheetsClient(
        credentials_file="credentials.json",
        credentials_json=settings.google_credentials,
        api_key=settings.google_api_key,
    )


def fetch_google_sheets_data(
    spreadsheet_id: str,
    client: SheetReaderPort | None = None,
    target_sheet_name: str = TARGET_CONCESSION_SHEET,
) -> list[dict]:
    """Lê a aba alvo no Google Sheets e converte via parser de domínio."""
    sheet_client = client or build_google_sheets_client()
    sheet_title, rows = sheet_client.read_sheet_rows(spreadsheet_id, target_sheet_name)
    activities = parse_concession_sheet(rows)
    if not activities:
        raise ValueError(
            f"Nenhuma atividade válida foi extraída da aba '{sheet_title}'."
        )
    return [{"project_name": sheet_title.strip(), "activities": activities}]


async def get_manual_sync_status(session: AsyncSession) -> dict:
    """Consulta se o disparo manual está liberado ou em janela de cooldown (1 min)."""
    result = await session.execute(
        select(SyncLog)
        .where(SyncLog.triggered_by == "manual", SyncLog.status == "success")
        .order_by(SyncLog.finished_at.desc())
        .limit(1)
    )
    last_manual = result.scalars().first()

    last_any_result = await session.execute(
        select(SyncLog)
        .where(SyncLog.status == "success")
        .order_by(SyncLog.finished_at.desc())
        .limit(1)
    )
    last_any = last_any_result.scalars().first()

    now = datetime.now(timezone.utc)
    can_sync_now = True
    retry_after_seconds = 0
    next_allowed_at = None

    if last_manual and last_manual.finished_at:
        finished_utc = (
            last_manual.finished_at
            if last_manual.finished_at.tzinfo is not None
            else last_manual.finished_at.replace(tzinfo=timezone.utc)
        )
        elapsed = (now - finished_utc).total_seconds()
        if elapsed < MANUAL_SYNC_COOLDOWN_SECONDS:
            can_sync_now = False
            retry_after_seconds = max(1, math.ceil(MANUAL_SYNC_COOLDOWN_SECONDS - elapsed))
            next_allowed_at = finished_utc + timedelta(seconds=MANUAL_SYNC_COOLDOWN_SECONDS)

    return {
        "can_sync_now": can_sync_now,
        "cooldown_seconds": MANUAL_SYNC_COOLDOWN_SECONDS,
        "retry_after_seconds": retry_after_seconds,
        "next_allowed_at": next_allowed_at,
        "last_sync_at": last_any.finished_at if last_any else None,
        "last_sync_by": last_any.triggered_by if last_any else None,
        "last_sync_items": last_any.items_count if last_any else None,
    }


async def _ensure_coordenadorias(
    session: AsyncSession, activities_data: list[dict]
) -> None:
    """Registra áreas executoras novas em uma única consulta + insert em lote."""
    unique_departments = {
        dept.strip()
        for row in activities_data
        for dept in (row.get("department") or [])
        if dept and dept.strip()
    }
    if not unique_departments:
        return

    existing_result = await session.execute(
        select(Coordenadoria.name).where(Coordenadoria.name.in_(unique_departments))
    )
    existing_names = set(existing_result.scalars().all())

    for dept_name in sorted(unique_departments - existing_names):
        session.add(Coordenadoria(name=dept_name, emails=[]))


def _apply_activity_fields(activity: Activity, row: dict) -> None:
    """Atualiza todos os atributos da Activity preservando o UUID existente."""
    updatable_fields = (
        "source_row_key",
        "mrae",
        "instrument",
        "contract",
        "clause",
        "phase",
        "thematic_group",
        "group_item",
        "description",
        "nature",
        "prior_step",
        "prior_step_deadline",
        "prior_step_deadline_text",
        "primary_responsible",
        "department",
        "contractual_deadline_text",
        "periodicity",
        "start_date",
        "initial_deadline_text",
        "deadline",
        "final_deadline_text",
        "actual_start_date",
        "actual_end_date",
        "status",
        "observations",
        "sei_number",
        "object_summary",
        "arpe_entry_date",
        "arpe_final_date",
        "arpe_status",
        "sei_2",
        "summary",
    )
    for field in updatable_fields:
        setattr(activity, field, row.get(field))


async def save_extracted_data(
    session: AsyncSession, parsed_projects: list[dict]
) -> list[Project]:
    """Persiste projetos e aplica Upsert idempotente de atividades por source_row_key."""
    saved_projects: list[Project] = []

    for proj_data in parsed_projects:
        project_name = proj_data["project_name"]
        activities_data = proj_data["activities"]

        result = await session.execute(
            select(Project).filter(Project.name == project_name)
        )
        project = result.scalars().first()

        if not project:
            project = Project(
                name=project_name, description=f"Importado da aba {project_name}"
            )
            session.add(project)
            await session.flush()

        await _ensure_coordenadorias(session, activities_data)

        existing_result = await session.execute(
            select(Activity).where(Activity.project_id == project.id)
        )
        existing_activities = existing_result.scalars().all()
        existing_by_key = {
            act.source_row_key: act
            for act in existing_activities
            if act.source_row_key
        }
        incoming_keys = {
            row["source_row_key"] for row in activities_data if row.get("source_row_key")
        }

        # Remove registros legados sem source_row_key ou que saíram da planilha
        ids_to_delete = [
            act.id
            for act in existing_activities
            if not act.source_row_key or act.source_row_key not in incoming_keys
        ]
        if ids_to_delete:
            await session.execute(
                delete(Activity).where(Activity.id.in_(ids_to_delete))
            )

        for row in activities_data:
            row_key = row.get("source_row_key")
            existing_activity = existing_by_key.get(row_key) if row_key else None
            if existing_activity is not None:
                _apply_activity_fields(existing_activity, row)
            else:
                new_activity = Activity(project_id=project.id)
                _apply_activity_fields(new_activity, row)
                session.add(new_activity)

        saved_projects.append(project)

    await session.commit()

    project_ids = [p.id for p in saved_projects]
    if not project_ids:
        return []

    db_result = await session.execute(
        select(Project)
        .filter(Project.id.in_(project_ids))
        .options(selectinload(Project.activities))
    )
    return list(db_result.scalars().all())


async def sync_projects_from_google_sheets(
    triggered_by: str = "cron",
    client: SheetReaderPort | None = None,
) -> list[Project]:
    """
    Orquestra lock assíncrono, validação de cooldown manual (1 min),
    leitura no Google Sheets, upsert idempotente no PostgreSQL e registro de SyncLog.
    """
    url = settings.google_sheet_url
    if not url or not url.strip():
        raise ValueError(
            "A variável de ambiente GOOGLE_SHEET_URL não está configurada no backend."
        )

    spreadsheet_id = extract_spreadsheet_id(url)

    async with _sync_lock:
        if triggered_by == "manual":
            async with async_session_maker() as check_session:
                sync_status = await get_manual_sync_status(check_session)
                if not sync_status["can_sync_now"]:
                    retry_after = sync_status["retry_after_seconds"]
                    raise TooManyRequestsError(
                        message=(
                            "Sincronização manual realizada recentemente. "
                            f"Aguarde {retry_after}s para sincronizar novamente."
                        ),
                        retry_after_seconds=retry_after,
                    )

        async with async_session_maker() as log_session:
            sync_log = SyncLog(triggered_by=triggered_by, status="running")
            log_session.add(sync_log)
            await log_session.commit()
            sync_log_id = sync_log.id

        try:
            logger.info(
                "⏰ Sincronização (%s): lendo aba '%s' da planilha ID %s",
                triggered_by,
                TARGET_CONCESSION_SHEET,
                spreadsheet_id,
            )
            parsed_projects = await asyncio.to_thread(
                fetch_google_sheets_data,
                spreadsheet_id,
                client,
                TARGET_CONCESSION_SHEET,
            )

            async with async_session_maker() as session:
                try:
                    saved_projects = await save_extracted_data(session, parsed_projects)
                except Exception:
                    await session.rollback()
                    raise

            total_items = sum(len(p.activities) for p in saved_projects)
            async with async_session_maker() as log_session:
                db_log = await log_session.get(SyncLog, sync_log_id)
                if db_log:
                    db_log.status = "success"
                    db_log.items_count = total_items
                    db_log.finished_at = datetime.now(timezone.utc)
                    await log_session.commit()

            logger.info(
                "✅ Sincronização concluída (%s): %d projeto(s), %d atividades.",
                triggered_by,
                len(saved_projects),
                total_items,
            )
            return saved_projects
        except Exception as exc:
            async with async_session_maker() as log_session:
                db_log = await log_session.get(SyncLog, sync_log_id)
                if db_log:
                    db_log.status = "failed"
                    db_log.error_message = str(exc)
                    db_log.finished_at = datetime.now(timezone.utc)
                    await log_session.commit()
            raise
