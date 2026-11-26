from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.exceptions import TooManyRequestsError
from app.database.session import get_db
from app.dependencies import CurrentUser, SyncAuthorizedUser
from app.domain.projects.activity_query import (
    ActivityQueryParams,
    query_paginated_activities,
)
from app.domain.projects.models import Project
from app.domain.projects.schemas import (
    PaginatedActivitiesOut,
    ProjectSchema,
    ProjectSimpleOut,
    SyncStatusOut,
)
from app.domain.projects.services import (
    get_manual_sync_status,
    sync_projects_from_google_sheets,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/sync/status", response_model=SyncStatusOut)
async def sync_status(
    _: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Retorna o status da última sincronização e se o cooldown manual (1 min) está ativo."""
    return await get_manual_sync_status(db)


@router.post("/sync", response_model=list[ProjectSchema], status_code=status.HTTP_200_OK)
async def sync_google_sheets(
    _: SyncAuthorizedUser,
):
    """
    Sincroniza a aba 'Concessão' via Google Sheets API (Service Account ou API Key).
    Restrito a admin/coordenador e protegido por cooldown manual de 1 minuto.
    """
    try:
        saved_projects = await sync_projects_from_google_sheets(triggered_by="manual")
        return saved_projects
    except TooManyRequestsError as tmre:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=tmre.message,
            headers={"Retry-After": str(tmre.retry_after_seconds)},
        )
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
                "Verifique GOOGLE_SHEET_URL, GOOGLE_API_KEY ou credentials.json."
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
    mrae: str | None = None,
    instrumento: str | None = None,
    mes_inicial: str | None = None,
    mes_final: str | None = None,
    executor: str | None = None,
    coordenadoria: str | None = None,
    responsavel: str | None = None,
    project: str | None = None,
    status_filter: str | None = None,
    prazo: int | None = None,
):
    """
    Lista atividades paginadas com filtros combinaveis (MRAE, Instrumento, Periodo, Executor, Status),
    busca textual full-row, 5 KPIs reativos e opcoes dinamicas de filtro.
    """
    params = ActivityQueryParams(
        page=page,
        limit=limit,
        activity_id=activity_id,
        search=search,
        mrae=mrae,
        instrumento=instrumento,
        mes_inicial=mes_inicial,
        mes_final=mes_final,
        executor=executor,
        coordenadoria=coordenadoria,
        responsavel=responsavel,
        project=project,
        status_filter=status_filter,
        prazo=prazo,
    )
    try:
        return await query_paginated_activities(db, params)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    _: SyncAuthorizedUser,
    db: AsyncSession = Depends(get_db),
):
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
