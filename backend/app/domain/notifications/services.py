import uuid
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.notifications.models import Notification


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    content: str,
    activity_id: uuid.UUID | None = None,
    type: str = "info",
) -> Notification:
    notification = Notification(
        user_id=user_id,
        title=title,
        content=content,
        activity_id=activity_id,
        type=type,
    )
    db.add(notification)
    await db.commit()
    return notification


async def list_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    only_unread: bool = False,
) -> list[Notification]:
    query = select(Notification).where(Notification.user_id == user_id)
    if only_unread:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def mark_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_id: uuid.UUID,
) -> Notification | None:
    query = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == user_id
    )
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    if notification:
        notification.is_read = True
        await db.commit()
    return notification


async def mark_all_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> None:
    query = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.execute(query)
    await db.commit()


async def get_unread_count(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    query = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
    )
    result = await db.execute(query)
    return result.scalar() or 0
