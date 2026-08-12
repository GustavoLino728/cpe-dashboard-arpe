import os
import re
import logging
import asyncio
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database.session import async_session_maker
from app.domain.projects.models import Project
from app.domain.activities.models import Activity
from app.domain.projects.excel_parser import parse_sheet_activities

from google.oauth2 import service_account
from googleapiclient.discovery import build

logger = logging.getLogger("Gestão de Projetos")

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
        raise RuntimeError(str(e))


async def save_extracted_data(session: AsyncSession, parsed_projects: list[dict]) -> list[Project]:
    saved_projects = []
    
    for proj_data in parsed_projects:
        project_name = proj_data["project_name"]
        activities_data = proj_data["activities"]
        
        # 1. Get or create the Project
        result = await session.execute(
            select(Project).filter(Project.name == project_name)
        )
        project = result.scalars().first()
        
        if not project:
            project = Project(name=project_name, description=f"Importado da aba {project_name}")
            session.add(project)
            await session.flush() # get the ID
        else:
            # Limpar atividades antigas do projeto para evitar duplicidade
            await session.execute(
                delete(Activity).filter(Activity.project_id == project.id)
            )
            
        # 2. Save activities
        for row in activities_data:
            activity = Activity(
                project_id=project.id,
                description=row["description"],
                sei_number=row["sei_number"],
                department=row["department"],
                start_date=row["start_date"],
                deadline=row["deadline"],
                working_days=row["working_days"],
                new_date=row["new_date"],
                status=row["status"],
                observations=row["observations"]
            )
            session.add(activity)
            
        saved_projects.append(project)
        
    await session.commit()
    
    # Reload all saved projects with activities loaded
    project_ids = [p.id for p in saved_projects]
    final_result = []
    if project_ids:
        db_result = await session.execute(
            select(Project)
            .filter(Project.id.in_(project_ids))
            .options(selectinload(Project.activities))
        )
        final_result = db_result.scalars().all()
        
    return final_result


async def sync_projects_from_google_sheets() -> list[Project]:
    url = settings.google_sheet_url
    if not url or not url.strip():
        raise ValueError("A variável de ambiente GOOGLE_SHEET_URL não está configurada no backend.")
        
    # Procura pelo ID da planilha no padrão "/d/[ID]/" ou assume que já é o ID direto
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", url)
    if match:
        spreadsheet_id = match.group(1)
    else:
        spreadsheet_id = url.strip()
        
    if not spreadsheet_id:
        raise ValueError("O link ou ID da planilha definido em GOOGLE_SHEET_URL é inválido.")
        
    logger.info(f"⏰ Sincronização automática: Iniciando busca para planilha ID: {spreadsheet_id}")
    
    # Executa a busca síncrona do Google Sheets em uma thread separada
    parsed_projects = await asyncio.to_thread(fetch_google_sheets_data, spreadsheet_id)
    
    if not parsed_projects:
        raise ValueError("Nenhum dado de projeto ou atividade pôde ser extraído da planilha.")
        
    # Abre uma sessão de banco de dados assíncrona para salvar
    async with async_session_maker() as session:
        try:
            saved_projects = await save_extracted_data(session, parsed_projects)
            logger.info(f"✅ Sincronização concluída com sucesso! {len(saved_projects)} projetos atualizados.")
            return saved_projects
        except Exception:
            await session.rollback()
            raise
