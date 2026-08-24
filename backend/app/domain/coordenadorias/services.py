import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.coordenadorias.models import Coordenadoria
from app.domain.coordenadorias.schemas import CoordenadoriaCreate, CoordenadoriaUpdate

async def get_coordenadoria_by_id(db: AsyncSession, id: uuid.UUID) -> Coordenadoria | None:
    result = await db.execute(select(Coordenadoria).where(Coordenadoria.id == id))
    return result.scalar_one_or_none()

async def get_coordenadoria_by_name(db: AsyncSession, name: str) -> Coordenadoria | None:
    result = await db.execute(select(Coordenadoria).where(Coordenadoria.name == name))
    return result.scalar_one_or_none()

async def list_coordenadorias(db: AsyncSession) -> list[Coordenadoria]:
    result = await db.execute(select(Coordenadoria).order_by(Coordenadoria.name.asc()))
    return list(result.scalars().all())

async def create_coordenadoria(db: AsyncSession, data: CoordenadoriaCreate) -> Coordenadoria:
    coordenadoria = Coordenadoria(
        name=data.name.strip(),
        emails=[email.strip() for email in data.emails if email.strip()]
    )
    db.add(coordenadoria)
    await db.commit()
    await db.refresh(coordenadoria)
    return coordenadoria

async def update_coordenadoria(
    db: AsyncSession, id: uuid.UUID, data: CoordenadoriaUpdate
) -> Coordenadoria | None:
    coordenadoria = await get_coordenadoria_by_id(db, id)
    if not coordenadoria:
        return None
    if data.name is not None:
        coordenadoria.name = data.name.strip()
    if data.emails is not None:
        coordenadoria.emails = [email.strip() for email in data.emails if email.strip()]
    await db.commit()
    await db.refresh(coordenadoria)
    return coordenadoria

async def delete_coordenadoria(db: AsyncSession, id: uuid.UUID) -> bool:
    coordenadoria = await get_coordenadoria_by_id(db, id)
    if not coordenadoria:
        return False
    await db.delete(coordenadoria)
    await db.commit()
    return True
