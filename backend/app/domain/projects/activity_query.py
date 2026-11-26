from dataclasses import dataclass
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import Text, and_, case, cast, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.activities.models import Activity
from app.domain.contract_links.models import ContractLink
from app.domain.projects.activity_filters import (
    clean_executor_label,
    escape_like_term,
    fold_accents,
    normalize_status_filter_key,
    resolve_period_bounds,
)
from app.domain.projects.models import Project
from app.domain.projects.schemas import (
    ActivityKpisOut,
    ActivityOutSchema,
    PaginatedActivitiesOut,
)

_ACCENTED_CHARS = "ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑáàâãäéèêëíìîïóòôõöúùûüçñ"
_ASCII_CHARS = "aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn"


@dataclass(frozen=True)
class ActivityQueryParams:
    page: int = 1
    limit: int = 15
    activity_id: UUID | None = None
    search: str | None = None
    mrae: str | None = None
    instrumento: str | None = None
    mes_inicial: str | None = None
    mes_final: str | None = None
    executor: str | None = None
    coordenadoria: str | None = None
    responsavel: str | None = None
    project: str | None = None
    status_filter: str | None = None
    prazo: int | None = None
    reference_date: date | None = None


def _split_contracts(contract: str | None) -> list[str]:
    if not contract:
        return []
    return [part.strip() for part in contract.split("/") if part.strip()]


def _fold_sql_column(column):
    """Normaliza acentos e caixa em SQL PostgreSQL sem exigir extensao unaccent."""
    return func.translate(
        func.lower(func.coalesce(cast(column, Text), "")),
        _ACCENTED_CHARS,
        _ASCII_CHARS,
    )


def build_status_predicates(today: date):
    """
    Retorna as 4 expressoes booleanas mutuamente exclusivas alinhadas a RN01:
    (is_done, is_late, is_in_progress, is_to_start).
    """
    effective_deadline = func.coalesce(Activity.new_date, Activity.deadline)
    status_safe = func.coalesce(Activity.status, "")

    is_done = status_safe.ilike("%conclu%")
    is_late = and_(
        not_(is_done),
        effective_deadline.is_not(None),
        effective_deadline < today,
    )
    is_in_progress = and_(
        not_(is_done),
        not_(is_late),
        status_safe.ilike("%andamento%"),
    )
    is_to_start = and_(not_(is_done), not_(is_late), not_(is_in_progress))
    return effective_deadline, is_done, is_late, is_in_progress, is_to_start


def build_full_row_search_clause(search: str):
    """
    Constroi clausula OR abrangendo todas as colunas relevantes da linha (RF04),
    com escape seguro de curingas LIKE ('\\', '%', '_') e tolerancia a acentos (RNF01).
    """
    cleaned = search.strip()
    if not cleaned:
        return None

    pattern = f"%{escape_like_term(fold_accents(cleaned))}%"
    searchable_columns = (
        Project.name,
        Activity.mrae,
        Activity.instrument,
        Activity.clause,
        Activity.phase,
        Activity.thematic_group,
        Activity.nature,
        Activity.description,
        Activity.prior_step,
        Activity.prior_step_deadline,
        Activity.prior_step_deadline_text,
        Activity.primary_responsible,
        Activity.department,
        Activity.contractual_deadline_text,
        Activity.periodicity,
        Activity.start_date,
        Activity.initial_deadline_text,
        Activity.deadline,
        Activity.final_deadline_text,
        Activity.working_days,
        Activity.new_date,
        Activity.actual_start_date,
        Activity.actual_end_date,
        Activity.status,
        Activity.observations,
        Activity.sei_number,
        Activity.object_summary,
        Activity.arpe_entry_date,
        Activity.arpe_final_date,
        Activity.arpe_status,
        Activity.sei_2,
        Activity.summary,
        Activity.group_item,
        Activity.contract,
        Activity.step_number,
        Activity.delay_justification_problem,
        Activity.delay_justification_action,
        Activity.delay_justification_responsible,
    )
    return or_(*[_fold_sql_column(col).like(pattern, escape="\\") for col in searchable_columns])


def build_period_filter_clause(
    period_start: date | None,
    period_end: date | None,
    effective_deadline,
):
    """
    Traduz RN04 para predicado SQLAlchemy, mantendo vigencia aberta [start_date, +inf)
    quando o item possui start_date e nao possui effective_deadline.
    """
    if period_start is None and period_end is None:
        return None

    has_any_date = or_(Activity.start_date.is_not(None), effective_deadline.is_not(None))

    if period_start is not None and period_end is not None:
        both_present = and_(
            Activity.start_date.is_not(None),
            effective_deadline.is_not(None),
            Activity.start_date <= period_end,
            effective_deadline >= period_start,
        )
        open_end = and_(
            Activity.start_date.is_not(None),
            effective_deadline.is_(None),
            Activity.start_date <= period_end,
        )
        only_end = and_(
            Activity.start_date.is_(None),
            effective_deadline.is_not(None),
            effective_deadline >= period_start,
            effective_deadline <= period_end,
        )
        return and_(has_any_date, or_(both_present, open_end, only_end))

    if period_start is not None:
        return and_(
            has_any_date,
            or_(
                and_(effective_deadline.is_(None), Activity.start_date.is_not(None)),
                and_(effective_deadline.is_not(None), effective_deadline >= period_start),
            ),
        )

    anchor_date = func.coalesce(Activity.start_date, effective_deadline)
    return and_(has_any_date, anchor_date <= period_end)


def build_activity_where_clauses(params: ActivityQueryParams) -> tuple[list, tuple]:
    """
    Monta todas as clausulas WHERE combinadas em AND e retorna tambem as expressoes de status.
    """
    today = params.reference_date or date.today()
    effective_deadline, is_done, is_late, is_in_progress, is_to_start = build_status_predicates(
        today
    )
    clauses = []

    if params.activity_id:
        clauses.append(Activity.id == params.activity_id)

    if params.search and params.search.strip():
        search_clause = build_full_row_search_clause(params.search)
        if search_clause is not None:
            clauses.append(search_clause)

    if params.mrae and params.mrae.strip().lower() not in ("todos", "todas"):
        clauses.append(func.trim(Activity.mrae) == params.mrae.strip())

    if params.instrumento and params.instrumento.strip().lower() not in ("todos", "todas"):
        clauses.append(func.trim(Activity.instrument) == params.instrumento.strip())

    if params.project and params.project.strip().lower() != "todos":
        clauses.append(Project.name == params.project.strip())

    executor_value = params.executor or params.coordenadoria
    if executor_value and executor_value.strip().lower() not in ("todos", "todas"):
        cleaned_exec = clean_executor_label(executor_value)
        if cleaned_exec:
            clauses.append(
                or_(
                    Activity.department.any(cleaned_exec),
                    Activity.department.any(f"ARPE ({cleaned_exec})"),
                )
            )

    if params.responsavel and params.responsavel.strip():
        cleaned_resp = clean_executor_label(params.responsavel)
        resp_pattern = f"%{escape_like_term(fold_accents(params.responsavel.strip()))}%"
        clauses.append(
            or_(
                Activity.department.any(cleaned_resp),
                Activity.department.any(f"ARPE ({cleaned_resp})"),
                _fold_sql_column(Activity.primary_responsible).like(
                    resp_pattern, escape="\\"
                ),
            )
        )

    period_start, period_end = resolve_period_bounds(params.mes_inicial, params.mes_final)
    period_clause = build_period_filter_clause(period_start, period_end, effective_deadline)
    if period_clause is not None:
        clauses.append(period_clause)

    status_key = normalize_status_filter_key(params.status_filter)
    if status_key == "ok":
        clauses.append(is_done)
    elif status_key == "warn":
        clauses.append(is_in_progress)
    elif status_key == "pending":
        clauses.append(is_to_start)
    elif status_key == "late":
        clauses.append(is_late)

    if params.prazo is not None:
        prazo_final = today + timedelta(days=params.prazo)
        clauses.append(
            and_(
                not_(is_done),
                effective_deadline.is_not(None),
                effective_deadline >= today,
                effective_deadline <= prazo_final,
            )
        )

    return clauses, (is_done, is_late, is_in_progress, is_to_start)


def build_activities_select_and_kpis_queries(params: ActivityQueryParams):
    """
    Constroi as queries SQLAlchemy para: (items_stmt, kpis_stmt).
    """
    clauses, (is_done, is_late, is_in_progress, is_to_start) = build_activity_where_clauses(
        params
    )

    items_stmt = (
        select(Activity, Project.name.label("project_name"))
        .select_from(Activity)
        .join(Project, Project.id == Activity.project_id)
    )
    kpis_stmt = (
        select(
            func.count().label("total"),
            func.coalesce(func.sum(case((is_done, 1), else_=0)), 0).label("concluidas"),
            func.coalesce(func.sum(case((is_late, 1), else_=0)), 0).label("atrasadas"),
            func.coalesce(func.sum(case((is_in_progress, 1), else_=0)), 0).label(
                "em_andamento"
            ),
            func.coalesce(func.sum(case((is_to_start, 1), else_=0)), 0).label("a_iniciar"),
        )
        .select_from(Activity)
        .join(Project, Project.id == Activity.project_id)
    )

    if clauses:
        items_stmt = items_stmt.where(*clauses)
        kpis_stmt = kpis_stmt.where(*clauses)

    safe_page = max(1, params.page)
    safe_limit = max(1, min(params.limit, 500))
    offset = (safe_page - 1) * safe_limit

    items_stmt = (
        items_stmt.order_by(
            Project.name.asc(),
            Activity.mrae.asc().nulls_last(),
            Activity.step_number.asc().nulls_last(),
            Activity.created_at.asc(),
            Activity.id.asc(),
        )
        .limit(safe_limit)
        .offset(offset)
    )
    return items_stmt, kpis_stmt


async def _load_filter_metadata(
    db: AsyncSession,
) -> tuple[list[str], list[str], list[str], list[str]]:
    proj_result = await db.execute(select(Project.name).order_by(Project.name.asc()))
    projetos = [p for p in proj_result.scalars().all() if p]

    mrae_result = await db.execute(
        select(func.trim(Activity.mrae))
        .where(Activity.mrae.is_not(None), func.trim(Activity.mrae) != "")
        .distinct()
        .order_by(func.trim(Activity.mrae).asc())
    )
    mraes = [m for m in mrae_result.scalars().all() if m]

    inst_result = await db.execute(
        select(func.trim(Activity.instrument))
        .where(Activity.instrument.is_not(None), func.trim(Activity.instrument) != "")
        .distinct()
        .order_by(func.trim(Activity.instrument).asc())
    )
    instrumentos = [i for i in inst_result.scalars().all() if i]

    dept_result = await db.execute(
        select(Activity.department).where(Activity.department.is_not(None))
    )
    executores_set: set[str] = set()
    for depts in dept_result.scalars().all():
        if not depts:
            continue
        for dept in depts:
            cleaned = clean_executor_label(dept)
            if cleaned and cleaned != "Sem Setor":
                executores_set.add(cleaned)

    return projetos, mraes, instrumentos, sorted(executores_set)


async def _load_contract_links_map(
    db: AsyncSession,
    rows: list,
) -> dict[tuple[UUID, str], str]:
    needed_contracts = {
        (activity.project_id, contract)
        for activity, _project_name in rows
        for contract in _split_contracts(activity.contract)
    }
    if not needed_contracts:
        return {}

    link_result = await db.execute(
        select(ContractLink).where(
            or_(
                *[
                    and_(
                        ContractLink.project_id == proj_id,
                        ContractLink.contract == contract,
                    )
                    for proj_id, contract in needed_contracts
                ]
            )
        )
    )
    return {
        (link.project_id, link.contract): link.url
        for link in link_result.scalars().all()
    }


def _map_row_to_schema(
    activity: Activity,
    project_name: str,
    contract_lookup: dict[tuple[UUID, str], str],
) -> ActivityOutSchema:
    contract_links = [
        {
            "contract": contract,
            "url": contract_lookup.get((activity.project_id, contract)),
        }
        for contract in _split_contracts(activity.contract)
    ]
    first_contract_url = next(
        (item["url"] for item in contract_links if item["url"]),
        None,
    )
    return ActivityOutSchema(
        id=activity.id,
        project_id=activity.project_id,
        project_name=project_name,
        source_row_key=activity.source_row_key,
        mrae=activity.mrae,
        instrument=activity.instrument,
        clause=activity.clause,
        phase=activity.phase,
        thematic_group=activity.thematic_group,
        nature=activity.nature,
        description=activity.description,
        prior_step=activity.prior_step,
        prior_step_deadline=activity.prior_step_deadline,
        prior_step_deadline_text=activity.prior_step_deadline_text,
        primary_responsible=activity.primary_responsible,
        sei_number=activity.sei_number,
        department=activity.department,
        contractual_deadline_text=activity.contractual_deadline_text,
        periodicity=activity.periodicity,
        start_date=activity.start_date,
        initial_deadline_text=activity.initial_deadline_text,
        deadline=activity.deadline,
        final_deadline_text=activity.final_deadline_text,
        working_days=activity.working_days,
        new_date=activity.new_date,
        status=activity.status,
        observations=activity.observations,
        object_summary=activity.object_summary,
        arpe_entry_date=activity.arpe_entry_date,
        arpe_final_date=activity.arpe_final_date,
        arpe_status=activity.arpe_status,
        sei_2=activity.sei_2,
        summary=activity.summary,
        group_item=activity.group_item,
        contract=activity.contract,
        contract_url=first_contract_url,
        contract_links=contract_links,
        step_number=activity.step_number,
        actual_start_date=activity.actual_start_date,
        actual_end_date=activity.actual_end_date,
        delay_justification_problem=activity.delay_justification_problem,
        delay_justification_action=activity.delay_justification_action,
        delay_justification_responsible=activity.delay_justification_responsible,
        created_at=activity.created_at,
        updated_at=activity.updated_at,
    )


async def query_paginated_activities(
    db: AsyncSession,
    params: ActivityQueryParams,
) -> PaginatedActivitiesOut:
    """
    Executa consulta combinada (AND) + busca full-row + calculo dos 5 KPIs reativos
    e retorna os metadados dinamicos de filtros.
    """
    items_stmt, kpis_stmt = build_activities_select_and_kpis_queries(params)

    projetos, mraes, instrumentos, executores = await _load_filter_metadata(db)

    kpi_row = (await db.execute(kpis_stmt)).one()
    kpis = ActivityKpisOut(
        total=int(kpi_row.total or 0),
        concluidas=int(kpi_row.concluidas or 0),
        atrasadas=int(kpi_row.atrasadas or 0),
        em_andamento=int(kpi_row.em_andamento or 0),
        a_iniciar=int(kpi_row.a_iniciar or 0),
    )

    rows = (await db.execute(items_stmt)).all()
    contract_lookup = await _load_contract_links_map(db, rows)
    activities_out = [
        _map_row_to_schema(activity, project_name, contract_lookup)
        for activity, project_name in rows
    ]

    return PaginatedActivitiesOut(
        total=kpis.total,
        page=max(1, params.page),
        limit=max(1, min(params.limit, 500)),
        activities=activities_out,
        kpis=kpis,
        coordenadorias=executores,
        projetos=projetos,
        mraes=mraes,
        instrumentos=instrumentos,
        executores=executores,
    )
