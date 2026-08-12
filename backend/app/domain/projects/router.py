import os
import re
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.config import settings
from app.domain.projects.schemas import ProjectSchema, ProjectSimpleOut
from app.domain.projects.models import Project
from app.domain.projects.services import save_extracted_data
from app.domain.projects.excel_parser import parse_sheet_activities
from uuid import UUID

from google.oauth2 import service_account
from googleapiclient.discovery import build

router = APIRouter(prefix="/projects", tags=["Projects"])

def fetch_google_sheets_data(spreadsheet_id: str) -> list[dict]:
    CREDENTIALS_FILE = "credentials.json"
    if not os.path.exists(CREDENTIALS_FILE):
        raise FileNotFoundError(
            "Arquivo credentials.json não encontrado no backend. "
            "Por favor, configure a Conta de Serviço no Google Cloud Console "
            "e salve as credenciais como 'credentials.json' na pasta do backend."
        )
        
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    
    try:
        # Carrega credenciais da Conta de Serviço
        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=SCOPES
        )
        
        # Constrói o serviço da API do Google Sheets
        service = build('sheets', 'v4', credentials=creds)
        
        # Obtém metadados da planilha para listar todas as abas (worksheets)
        spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheets = spreadsheet.get('sheets', [])
        
        parsed_projects = []
        for sheet in sheets:
            sheet_title = sheet['properties']['title']
            
            # Obtém todos os valores da aba atual
            result = service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=sheet_title
            ).execute()
            
            rows = result.get('values', [])
            activities = parse_sheet_activities(rows)
            
            if activities:
                parsed_projects.append({
                    "project_name": sheet_title.strip(),
                    "activities": activities
                })
                
        return parsed_projects
    except Exception as e:
        # Repassa o erro geral com detalhes descritivos
        raise RuntimeError(str(e))


@router.post("/sync", response_model=list[ProjectSchema], status_code=status.HTTP_200_OK)
async def sync_google_sheets(
    db: AsyncSession = Depends(get_db)
):
    """
    Sincroniza os projetos utilizando a API oficial do Google Sheets via Conta de Serviço (Service Account).
    A URL da planilha é obtida a partir da variável de ambiente GOOGLE_SHEET_URL do backend.
    """
    url = settings.google_sheet_url
    if not url or not url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A variável de ambiente GOOGLE_SHEET_URL não está configurada no backend."
        )
        
    # Procura pelo ID da planilha no padrão "/d/[ID]/" ou assume que já é o ID direto
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", url)
    if match:
        spreadsheet_id = match.group(1)
    else:
        spreadsheet_id = url.strip()
        
    if not spreadsheet_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O link ou ID da planilha definido em GOOGLE_SHEET_URL é inválido."
        )

    try:
        # Executa a chamada síncrona do SDK do Google em uma thread pool para não bloquear o event loop
        parsed_projects = await asyncio.to_thread(fetch_google_sheets_data, spreadsheet_id)
    except FileNotFoundError as fnfe:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(fnfe)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Erro ao acessar API do Google Sheets: {str(e)}. "
                "Verifique se o ID da planilha está correto, se a API do Google Sheets está habilitada "
                "e se a planilha foi compartilhada com o e-mail da Conta de Serviço contido no credentials.json."
            )
        )

    if not parsed_projects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Nenhum dado de projeto ou atividade pôde ser extraído da planilha. "
                "Verifique se as abas contêm as colunas obrigatórias mapeadas (ex: 'Descrição Resumida')."
            )
        )

    saved_projects = await save_extracted_data(db, parsed_projects)
    return saved_projects


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
