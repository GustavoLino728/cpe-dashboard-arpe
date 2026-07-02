from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.domain.dashboard.schemas import (
    ProjectSummarySchema,
    PhaseStatusSchema,
    SectorLoadSchema,
    SectorStatusSchema,
    CriticalActivitySchema,
    TimelineEventSchema,
)
from app.domain.dashboard import services

router = APIRouter(prefix="/api/dashboard/projetos", tags=["Dashboard"])


@router.get("/{project}/resumo", response_model=ProjectSummarySchema)
async def get_project_summary(project: str, db: AsyncSession = Depends(get_db)):
    """Retorna os KPIs gerais (resumo) do projeto."""
    return await services.get_project_summary(db, project)


@router.get("/{project}/fases", response_model=list[PhaseStatusSchema])
async def get_project_phases(project: str, db: AsyncSession = Depends(get_db)):
    """Retorna o status consolidado das atividades agrupadas por fase."""
    return await services.get_project_phases(db, project)


@router.get("/{project}/setores", response_model=list[SectorLoadSchema])
async def get_project_sectors(project: str, db: AsyncSession = Depends(get_db)):
    """Retorna o volume de atividades distribuído entre os setores/responsáveis."""
    return await services.get_project_sectors(db, project)


@router.get("/{project}/setores-status", response_model=list[SectorStatusSchema])
async def get_project_sectors_status(project: str, db: AsyncSession = Depends(get_db)):
    """Retorna uma matriz de distribuição de status por setor (identificação de gargalos)."""
    return await services.get_project_sectors_status(db, project)


@router.get("/{project}/atividades-criticas", response_model=list[CriticalActivitySchema])
async def get_project_critical_activities(
    project: str,
    dias: int = 7,
    db: AsyncSession = Depends(get_db)
):
    """Retorna a lista prioritária de atividades próximas do prazo ou atrasadas."""
    return await services.get_project_critical_activities(db, project, dias)


@router.get("/{project}/timeline", response_model=list[TimelineEventSchema])
async def get_project_timeline(project: str, db: AsyncSession = Depends(get_db)):
    """Retorna os eventos operacionais ordenados de forma cronológica para gráficos temporais."""
    return await services.get_project_timeline(db, project)
