from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.domain.projects.models import Project
from app.domain.activities.models import Activity

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
