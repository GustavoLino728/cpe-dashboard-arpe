from typing import Generic, Type, TypeVar
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    """Generic Base Repository containing basic CRUD operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: any) -> ModelType | None:
        """Fetch an entity by its primary key ID."""
        return await self.session.get(self.model, id)

    async def create(self, entity: ModelType) -> ModelType:
        """Create a new entity in the database."""
        self.session.add(entity)
        await self.session.flush()
        return entity

    async def update(self, entity: ModelType) -> ModelType:
        """Update an existing entity in the database."""
        self.session.add(entity)
        await self.session.flush()
        return entity

    async def delete(self, entity: ModelType) -> None:
        """Delete an entity from the database."""
        await self.session.delete(entity)
        await self.session.flush()
