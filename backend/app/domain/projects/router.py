from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.domain.projects.schemas import ProjectSchema, ProjectSimpleOut, PaginatedActivitiesOut
from app.domain.projects.models import Project
from app.domain.projects.services import sync_projects_from_google_sheets
from uuid import UUID
from datetime import date, timedelta

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/sync", response_model=list[ProjectSchema], status_code=status.HTTP_200_OK)
async def sync_google_sheets():
    """
    Sincroniza os projetos utilizando a API oficial do Google Sheets via Conta de Serviço (Service Account).
    A URL da planilha é obtida a partir da variável de ambiente GOOGLE_SHEET_URL do backend.
    """
    try:
        saved_projects = await sync_projects_from_google_sheets()
        return saved_projects
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except FileNotFoundError as fnfe:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(fnfe)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Erro ao sincronizar com Google Sheets: {str(e)}. "
                "Verifique as variáveis de ambiente (incluindo GOOGLE_CREDENTIALS) e o arquivo credentials.json."
            )
        )


@router.get("", response_model=list[ProjectSchema])
async def list_projects(db: AsyncSession = Depends(get_db)):
    """
    Lista todos os projetos salvos com suas respectivas atividades.
    """
    result = await db.execute(
        select(Project).options(selectinload(Project.activities))
    )
    return result.scalars().all()


@router.get("/list", response_model=list[ProjectSimpleOut])
async def list_projects_simple(db: AsyncSession = Depends(get_db)):
    """
    Lista todos os projetos salvos sem carregar as atividades.
    """
    result = await db.execute(
        select(Project).order_by(Project.name.asc())
    )
    return result.scalars().all()


@router.get("/activities/paginated", response_model=PaginatedActivitiesOut)
async def list_paginated_activities(
    db: AsyncSession = Depends(get_db),
    page: int = 1,
    limit: int = 15,
    activity_id: UUID | None = None,
    search: str | None = None,
    coordenadoria: str | None = None,
    responsavel: str | None = None,
    project: str | None = None,
    status_filter: str | None = None,
    prazo: int | None = None,
):
    import re
    from sqlalchemy import and_, cast, func, not_, or_, String
    from app.domain.activities.models import Activity
    from app.domain.contract_links.models import ContractLink
    from app.domain.projects.schemas import PaginatedActivitiesOut, ActivityOutSchema

    def clean_coordenadoria_name(name: str) -> str:
        if not name:
            return ""
        trimmed = name.strip()
        match = re.match(r"^ARPE\s*\(([^)]+)\)$", trimmed, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return trimmed

    def split_contracts(contract: str | None) -> list[str]:
        if not contract:
            return []
        return [part.strip() for part in contract.split("/") if part.strip()]

    # 1. Obter metadados (todos os projetos e coordenadorias distintas)
    proj_result = await db.execute(select(Project.name).order_by(Project.name.asc()))
    projetos = [p for p in proj_result.scalars().all()]

    dept_result = await db.execute(select(Activity.department))
    dept_lists = dept_result.scalars().all()
    
    coordenadorias_set = set()
    for depts in dept_lists:
        if depts:
            for dept in depts:
                cleaned = clean_coordenadoria_name(dept)
                if cleaned and cleaned != "Sem Setor":
                    coordenadorias_set.add(cleaned)
                    
    coordenadorias = sorted(list(coordenadorias_set))

    # 2. Query paginada de atividades
    query = (
        select(Activity, Project.name.label("project_name"))
        .select_from(Activity)
        .join(Project, Project.id == Activity.project_id)
    )

    # Aplicar filtros
    if activity_id:
        query = query.filter(Activity.id == activity_id)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            Activity.description.ilike(search_filter) |
            Activity.contract.ilike(search_filter) |
            Activity.step_number.ilike(search_filter) |
            Project.name.ilike(search_filter)
        )

    if project and project != "todos":
        query = query.filter(Project.name == project)

    if coordenadoria and coordenadoria != "todas":
        query = query.filter(cast(Activity.department, String).ilike(f"%{coordenadoria}%"))

    if responsavel:
        query = query.filter(cast(Activity.department, String).ilike(f"%{responsavel}%"))

    effective_deadline = func.coalesce(Activity.new_date, Activity.deadline)
    is_done = Activity.status.ilike("%conclu%")
    is_late = and_(not_(is_done), effective_deadline.is_not(None), effective_deadline < date.today())

    if status_filter and status_filter != "todos":
        if status_filter == "ok":
            query = query.filter(is_done)
        elif status_filter == "warn":
            query = query.filter(
                and_(
                    Activity.status.ilike("%andamento%"),
                    not_(is_late),
                )
            )
        elif status_filter == "pending":
            query = query.filter(
                and_(
                    or_(
                        Activity.status.ilike("%iniciado%"),
                        Activity.status.ilike("%não iniciado%"),
                    ),
                    not_(is_late),
                )
            )
        elif status_filter == "late":
            query = query.filter(is_late)

    if prazo:
        prazo_final = date.today() + timedelta(days=prazo)
        query = query.filter(
            and_(
                not_(is_done),
                effective_deadline.is_not(None),
                effective_deadline >= date.today(),
                effective_deadline <= prazo_final,
            )
        )

    # Obter contagem total com filtros aplicados
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginar e ordernar
    offset = (page - 1) * limit
    query = query.order_by(Project.name.asc(), Activity.step_number.asc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    rows = result.all()

    activities_out = []
    contract_lookup: dict[tuple[UUID, str], str] = {}
    needed_contracts = {
        (activity.project_id, contract)
        for activity, _project_name in rows
        for contract in split_contracts(activity.contract)
    }
    if needed_contracts:
        link_result = await db.execute(
            select(ContractLink).where(
                or_(
                    *[
                        and_(
                            ContractLink.project_id == project_id,
                            ContractLink.contract == contract,
                        )
                        for project_id, contract in needed_contracts
                    ]
                )
            )
        )
        contract_lookup = {
            (link.project_id, link.contract): link.url
            for link in link_result.scalars().all()
        }

    for activity, project_name in rows:
        contract_links = [
            {
                "contract": contract,
                "url": contract_lookup.get((activity.project_id, contract)),
            }
            for contract in split_contracts(activity.contract)
        ]
        first_contract_url = next(
            (item["url"] for item in contract_links if item["url"]),
            None,
        )
        activities_out.append(
            ActivityOutSchema(
                id=activity.id,
                project_id=activity.project_id,
                project_name=project_name,
                description=activity.description,
                sei_number=activity.sei_number,
                department=activity.department,
                start_date=activity.start_date,
                deadline=activity.deadline,
                working_days=activity.working_days,
                new_date=activity.new_date,
                status=activity.status,
                observations=activity.observations,
                group_item=activity.group_item,
                contract=activity.contract,
                contract_url=first_contract_url,
                contract_links=contract_links,
                step_number=activity.step_number,
                actual_start_date=activity.actual_start_date,
                delay_justification_problem=activity.delay_justification_problem,
                delay_justification_action=activity.delay_justification_action,
                delay_justification_responsible=activity.delay_justification_responsible,
                created_at=activity.created_at,
                updated_at=activity.updated_at
            )
        )

    return PaginatedActivitiesOut(
        total=total,
        page=page,
        limit=limit,
        activities=activities_out,
        coordenadorias=coordenadorias,
        projetos=projetos
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Remove um projeto e todas as suas atividades associadas.
    """
    result = await db.execute(
        select(Project).filter(Project.id == project_id)
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado."
        )
    await db.delete(project)
    await db.commit()
