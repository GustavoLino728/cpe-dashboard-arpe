from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.domain.projects.schemas import ProjectSchema, ProjectSimpleOut
from app.domain.projects.models import Project
from app.domain.projects.services import sync_projects_from_google_sheets
from uuid import UUID

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
                "Verifique as variáveis de ambiente e o arquivo credentials.json."
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
