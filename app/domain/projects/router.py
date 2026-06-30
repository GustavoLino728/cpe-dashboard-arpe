from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.domain.projects.schemas import ProjectSchema
from app.domain.projects.models import Project
from app.domain.projects.services import save_extracted_data
from app.domain.projects.excel_parser import parse_excel_projects
from uuid import UUID

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/upload", response_model=ProjectSchema, status_code=status.HTTP_201_CREATED)
async def upload_projects_excel(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Recebe uma planilha Excel (.xlsx ou .xls), extrai os projetos, atividades e prazos,
    salva-os no banco de dados e retorna o projeto com as atividades extraídas.
    """
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas arquivos Excel (.xlsx ou .xls) são suportados."
        )
        
    parsed_data = parse_excel_projects(file)
    if not parsed_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum dado pôde ser extraído da planilha."
        )
        
    # Extrair o nome do projeto a partir do nome do arquivo (sem extensão)
    project_name = file.filename.rsplit(".", 1)[0]
    
    saved_project = await save_extracted_data(db, project_name, parsed_data)
    return saved_project

@router.get("", response_model=list[ProjectSchema])
async def list_projects(db: AsyncSession = Depends(get_db)):
    """
    Lista todos os projetos salvos com suas respectivas atividades.
    """
    result = await db.execute(
        select(Project).options(selectinload(Project.activities))
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
