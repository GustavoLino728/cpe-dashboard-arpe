import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CoordenadoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    emails: list[str]
    created_at: datetime
    updated_at: datetime

class CoordenadoriaCreate(BaseModel):
    name: str
    emails: list[str] = []

class CoordenadoriaUpdate(BaseModel):
    name: str | None = None
    emails: list[str] | None = None
