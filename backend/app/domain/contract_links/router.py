from fastapi import APIRouter, HTTPException, status
from app.dependencies import CurrentUser, DBSession
from app.domain.contract_links.schemas import ContractLinkOut, ContractLinkUpsert
from app.domain.contract_links import services
from app.domain.projects.models import Project
from sqlalchemy import select

router = APIRouter(prefix="/contract-links", tags=["Contract Links"])


@router.get("", response_model=list[ContractLinkOut])
async def list_links(
    db: DBSession,
    current_user: CurrentUser,
):
    return await services.list_contract_links(db)


@router.put("", response_model=ContractLinkOut, status_code=status.HTTP_200_OK)
async def upsert_link(
    data: ContractLinkUpsert,
    db: DBSession,
    current_user: CurrentUser,
):
    project_result = await db.execute(select(Project).where(Project.id == data.project_id))
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado.",
        )

    contract_link = await services.upsert_contract_link(db, data)
    return ContractLinkOut(
        id=contract_link.id,
        project_id=contract_link.project_id,
        project_name=project.name,
        contract=contract_link.contract,
        url=contract_link.url,
        activities_count=0,
        updated_at=contract_link.updated_at,
    )
