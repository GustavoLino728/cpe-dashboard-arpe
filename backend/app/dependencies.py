from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.context import get_current_user_id
from app.database.session import get_db
from app.domain.users.models import User

DBSession = Annotated[AsyncSession, Depends(get_db)]

async def get_current_user(
    db: DBSession,
    user_id: UUID = Depends(get_current_user_id),
) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário autenticado não encontrado.",
        )

    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

def require_role(role: str):
    async def dependency(current_user: CurrentUser) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso.",
            )
        return current_user
    return dependency

AdminUser = Annotated[User, Depends(require_role("admin"))]