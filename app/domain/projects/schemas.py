from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from uuid import UUID

class ActivitySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    description: str
    sei_number: str | None = None
    department: list[str] | None = None
    start_date: date | None = None
    deadline: date | None = None
    working_days: int | None = None
    new_date: date | None = None
    status: str
    observations: str | None = None
    created_at: datetime
    updated_at: datetime

class ProjectSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime
    activities: list[ActivitySchema] = []
