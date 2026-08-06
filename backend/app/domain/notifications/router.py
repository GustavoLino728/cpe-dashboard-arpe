import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import CurrentUser, DBSession
from app.domain.notifications.schemas import NotificationOut, UnreadCountOut
from app.domain.notifications import services

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationOut])
async def get_notifications(
    db: DBSession,
    current_user: CurrentUser,
    only_unread: bool = False,
):
    return await services.list_notifications(db, current_user.id, only_unread)


@router.get("/unread-count", response_model=UnreadCountOut)
async def get_unread_count(
    db: DBSession,
    current_user: CurrentUser,
):
    count = await services.get_unread_count(db, current_user.id)
    return UnreadCountOut(count=count)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    notification = await services.mark_as_read(db, current_user.id, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada.",
        )
    return notification


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_as_read(
    db: DBSession,
    current_user: CurrentUser,
):
    await services.mark_all_as_read(db, current_user.id)
