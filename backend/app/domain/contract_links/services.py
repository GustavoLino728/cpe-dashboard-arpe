from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.activities.models import Activity
from app.domain.contract_links.models import ContractLink
from app.domain.contract_links.schemas import ContractLinkOut, ContractLinkUpsert
from app.domain.projects.models import Project


async def list_contract_links(db: AsyncSession) -> list[ContractLinkOut]:
    activities_result = await db.execute(
        select(Activity.project_id, Project.name.label("project_name"), Activity.contract)
        .select_from(Activity)
        .join(Project, Project.id == Activity.project_id)
        .where(Activity.contract.is_not(None), Activity.contract != "")
    )

    grouped: dict[tuple, dict] = {}
    counts = defaultdict(int)
    for row in activities_result.all():
        for contract in split_contracts(row.contract):
            key = (row.project_id, contract)
            grouped[key] = {
                "project_id": row.project_id,
                "project_name": row.project_name,
                "contract": contract,
            }
            counts[key] += 1

    links_result = await db.execute(select(ContractLink))
    links = {
        (link.project_id, link.contract): link
        for link in links_result.scalars().all()
    }

    items = []
    for key, item in grouped.items():
        link = links.get(key)
        items.append(
            ContractLinkOut(
                id=link.id if link else None,
                project_id=item["project_id"],
                project_name=item["project_name"],
                contract=item["contract"],
                url=link.url if link else None,
                activities_count=counts[key],
                updated_at=link.updated_at if link else None,
            )
        )

    return sorted(items, key=lambda item: (item.project_name, item.contract))


async def upsert_contract_link(db: AsyncSession, data: ContractLinkUpsert) -> ContractLink:
    contract = data.contract.strip()
    result = await db.execute(
        select(ContractLink).where(
            ContractLink.project_id == data.project_id,
            ContractLink.contract == contract,
        )
    )
    contract_link = result.scalar_one_or_none()

    if contract_link:
        contract_link.url = str(data.url)
    else:
        contract_link = ContractLink(
            project_id=data.project_id,
            contract=contract,
            url=str(data.url),
        )
        db.add(contract_link)

    await db.commit()
    await db.refresh(contract_link)
    return contract_link


def split_contracts(contract: str | None) -> list[str]:
    if not contract:
        return []
    return [part.strip() for part in contract.split("/") if part.strip()]
