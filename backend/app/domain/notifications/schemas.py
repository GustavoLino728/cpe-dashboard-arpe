import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    activity_id: uuid.UUID | None = None
    title: str
    content: str
    is_read: bool
    type: str
    created_at: datetime
    updated_at: datetime


class UnreadCountOut(BaseModel):
    count: int
