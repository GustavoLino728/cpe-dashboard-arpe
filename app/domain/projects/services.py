from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.domain.projects.models import Project
from app.domain.activities.models import Activity

async def save_extracted_data(session: AsyncSession, project_name: str, parsed_rows: list[dict]) -> Project:
    # 1. Get or create the Project
    result = await session.execute(
        select(Project).filter(Project.name == project_name)
    )
    project = result.scalars().first()
    
    if not project:
        project = Project(name=project_name, description=f"Importado de {project_name}")
        session.add(project)
        await session.flush() # get the ID
    else:
        # Limpar atividades antigas do projeto para evitar duplicidade ou mesclagem incorreta
        await session.execute(
            delete(Activity).filter(Activity.project_id == project.id)
        )
        
    # 2. Save activities
    for row in parsed_rows:
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
            
    await session.commit()
    
    # Reload project with activities
    db_result = await session.execute(
        select(Project)
        .filter(Project.id == project.id)
        .options(selectinload(Project.activities))
    )
    return db_result.scalars().first()
