import uuid
import re
import unicodedata
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.domain.projects.models import Project
from app.domain.dashboard.schemas import (
    ProjectSummarySchema,
    PhaseStatusSchema,
    SectorLoadSchema,
    SectorStatusSchema,
    CriticalActivitySchema,
    TimelineEventSchema,
)


def slugify(text: str) -> str:
    """Gera um slug amigável a partir de um texto para comparações flexíveis."""
    text = unicodedata.normalize('NFKD', text)
    text = "".join([c for c in text if not unicodedata.combining(c)])
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')


async def resolve_project(db: AsyncSession, identifier: str) -> Project:
    """
    Busca um projeto de forma flexível:
    1. Por ID (UUID)
    2. Por nome exato
    3. Por slug do nome
    4. Por busca parcial de slug
    """
    # 1. Tenta buscar por UUID
    try:
        project_uuid = uuid.UUID(identifier)
        result = await db.execute(
            select(Project)
            .filter(Project.id == project_uuid)
            .options(selectinload(Project.activities))
        )
        proj = result.scalars().first()
        if proj:
            return proj
    except ValueError:
        pass

    # 2. Tenta buscar por nome exato
    result = await db.execute(
        select(Project)
        .filter(Project.name == identifier)
        .options(selectinload(Project.activities))
    )
    proj = result.scalars().first()
    if proj:
        return proj

    # 3. Busca todos os projetos para comparar slugs
    result = await db.execute(
        select(Project).options(selectinload(Project.activities))
    )
    all_projects = result.scalars().all()
    target_slug = slugify(identifier)

    # Correspondência exata de slug
    for p in all_projects:
        if slugify(p.name) == target_slug:
            return p

    # Correspondência parcial de slug
    for p in all_projects:
        p_slug = slugify(p.name)
        if target_slug in p_slug or p_slug in target_slug:
            return p

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Projeto '{identifier}' não encontrado."
    )


def get_activity_phase(act) -> str:
    """
    Classifica a atividade em uma fase baseada na data de referência.
    Utiliza new_date (novo prazo) ou deadline (prazo original), caindo para start_date se ambos forem nulos.
    """
    ref_date = act.new_date or act.deadline or act.start_date
    if not ref_date:
        return "Sem Fase"

    year = ref_date.year
    month = ref_date.month

    months_pt = {
        1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
        7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
    }

    # Caso específico: Junho/Julho de 2026 -> Fase 1
    if year == 2026 and month in (6, 7):
        return "Fase 1 (Jun–Jul/26)"

    # Determinação dinâmica baseada em meses a partir de Junho de 2026
    months_since_june_2026 = (year - 2026) * 12 + (month - 6)

    if months_since_june_2026 >= 2:  # Agosto de 2026 em diante
        phase_num = months_since_june_2026  # Ex: Agosto 2026 = Fase 2, Setembro = Fase 3
        month_name = months_pt.get(month, "")
        short_year = str(year)[-2:]
        return f"Fase {phase_num} ({month_name}/{short_year})"
    elif months_since_june_2026 < 0:
        month_name = months_pt.get(month, "")
        short_year = str(year)[-2:]
        return f"Fase Anterior ({month_name}/{short_year})"

    return "Fase 1 (Jun–Jul/26)"


async def get_project_summary(db: AsyncSession, project: str) -> ProjectSummarySchema:
    """Retorna os KPIs gerais (resumo) do projeto."""
    proj = await resolve_project(db, project)
    activities = proj.activities

    total = len(activities)
    concluidas = sum(1 for a in activities if a.status == "Concluído")
    em_andamento = sum(1 for a in activities if a.status == "Em andamento")
    nao_iniciadas = sum(1 for a in activities if a.status == "Não Iniciado")

    percentual = round((concluidas / total) * 100, 1) if total > 0 else 0.0

    today = date.today()
    prazos_7 = 0
    prazos_2 = 0
    atrasadas = 0

    for a in activities:
        if a.status == "Concluído":
            continue

        active_deadline = a.new_date or a.deadline
        if active_deadline:
            diff = (active_deadline - today).days
            if diff < 0:
                atrasadas += 1
            if 0 <= diff <= 7:
                prazos_7 += 1
            if 0 <= diff <= 2:
                prazos_2 += 1

    return ProjectSummarySchema(
        projeto=proj.name,
        data_referencia=today,
        total_atividades=total,
        concluidas=concluidas,
        em_andamento=em_andamento,
        nao_iniciadas=nao_iniciadas,
        percentual_conclusao=percentual,
        prazos_proximos_7_dias=prazos_7,
        prazos_criticos_2_dias=prazos_2,
        atrasadas=atrasadas
    )


async def get_project_phases(db: AsyncSession, project: str) -> list[PhaseStatusSchema]:
    """Retorna o status consolidado das atividades agrupadas por fase."""
    proj = await resolve_project(db, project)
    activities = proj.activities

    phases_map = {}
    for a in activities:
        phase = get_activity_phase(a)
        if phase not in phases_map:
            phases_map[phase] = {"concluido": 0, "em_andamento": 0, "nao_iniciado": 0}

        status_key = "nao_iniciado"
        if a.status == "Concluído":
            status_key = "concluido"
        elif a.status == "Em andamento":
            status_key = "em_andamento"

        phases_map[phase][status_key] += 1

    def phase_sort_key(phase_name: str):
        if "Anterior" in phase_name:
            return -1
        match = re.search(r"Fase (\d+)", phase_name)
        if match:
            return int(match.group(1))
        return 9999

    sorted_phases = sorted(phases_map.keys(), key=phase_sort_key)

    return [
        PhaseStatusSchema(
            fase=phase,
            concluido=phases_map[phase]["concluido"],
            em_andamento=phases_map[phase]["em_andamento"],
            nao_iniciado=phases_map[phase]["nao_iniciado"]
        )
        for phase in sorted_phases
    ]


async def get_project_sectors(db: AsyncSession, project: str) -> list[SectorLoadSchema]:
    """Retorna o volume de atividades distribuído entre os setores/responsáveis."""
    proj = await resolve_project(db, project)
    activities = proj.activities

    sector_counts = {}
    for a in activities:
        depts = a.department if a.department else ["Sem Setor"]
        for dept in depts:
            sector_counts[dept] = sector_counts.get(dept, 0) + 1

    sorted_sectors = sorted(sector_counts.items(), key=lambda x: x[1], reverse=True)

    return [
        SectorLoadSchema(setor=dept, total=total)
        for dept, total in sorted_sectors
    ]


async def get_project_sectors_status(db: AsyncSession, project: str) -> list[SectorStatusSchema]:
    """Retorna uma matriz de distribuição de status por setor (identificação de gargalos)."""
    proj = await resolve_project(db, project)
    activities = proj.activities

    sector_status = {}
    for a in activities:
        depts = a.department if a.department else ["Sem Setor"]
        status_key = "nao_iniciado"
        if a.status == "Concluído":
            status_key = "concluido"
        elif a.status == "Em andamento":
            status_key = "em_andamento"

        for dept in depts:
            if dept not in sector_status:
                sector_status[dept] = {"concluido": 0, "em_andamento": 0, "nao_iniciado": 0}
            sector_status[dept][status_key] += 1

    sorted_sectors = sorted(sector_status.keys())

    return [
        SectorStatusSchema(
            setor=dept,
            concluido=sector_status[dept]["concluido"],
            em_andamento=sector_status[dept]["em_andamento"],
            nao_iniciado=sector_status[dept]["nao_iniciado"]
        )
        for dept in sorted_sectors
    ]


async def get_project_critical_activities(
    db: AsyncSession, project: str, dias: int
) -> list[CriticalActivitySchema]:
    """Retorna a lista prioritária de atividades próximas do prazo ou atrasadas."""
    proj = await resolve_project(db, project)
    activities = proj.activities
    today = date.today()

    critical_activities = []
    for a in activities:
        if a.status == "Concluído":
            continue

        active_deadline = a.new_date or a.deadline
        if active_deadline:
            diff = (active_deadline - today).days
            if diff <= dias:
                dept_str = ", ".join(a.department) if a.department else "Sem Setor"
                critical_activities.append(
                    CriticalActivitySchema(
                        id=a.id,
                        descricao=a.description,
                        setor=dept_str,
                        prazo_final=active_deadline,
                        status=a.status,
                        dias_para_prazo=diff
                    )
                )

    critical_activities.sort(key=lambda x: x.dias_para_prazo)
    return critical_activities


async def get_project_timeline(db: AsyncSession, project: str) -> list[TimelineEventSchema]:
    """Retorna os eventos operacionais ordenados de forma cronológica para gráficos temporais."""
    proj = await resolve_project(db, project)
    activities = proj.activities

    timeline = []
    for a in activities:
        active_deadline = a.new_date or a.deadline
        phase = get_activity_phase(a)
        timeline.append(
            TimelineEventSchema(
                id=a.id,
                descricao=a.description,
                data_inicio=a.start_date,
                prazo_final=active_deadline,
                status=a.status,
                fase=phase
            )
        )

    def sort_key(event):
        start = event.data_inicio or date.max
        end = event.prazo_final or date.max
        return (start, end)

    timeline.sort(key=sort_key)
    return timeline
