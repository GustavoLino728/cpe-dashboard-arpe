from pydantic import BaseModel, ConfigDict, Field
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
    
    group_item: str | None = None
    contract: str | None = None
    contract_url: str | None = None
    step_number: str | None = None
    actual_start_date: date | None = None
    delay_justification_problem: str | None = None
    delay_justification_action: str | None = None
    delay_justification_responsible: str | None = None

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


class ProjectSimpleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class GoogleSheetsSyncSchema(BaseModel):
    url: str


class ActivityOutSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    project_name: str
    description: str
    sei_number: str | None = None
    department: list[str] | None = None
    start_date: date | None = None
    deadline: date | None = None
    working_days: int | None = None
    new_date: date | None = None
    status: str
    observations: str | None = None
    group_item: str | None = None
    contract: str | None = None
    contract_url: str | None = None
    contract_links: list[dict[str, str | None]] = Field(default_factory=list)
    step_number: str | None = None
    actual_start_date: date | None = None
    delay_justification_problem: str | None = None
    delay_justification_action: str | None = None
    delay_justification_responsible: str | None = None
    created_at: datetime
    updated_at: datetime


class PaginatedActivitiesOut(BaseModel):
    total: int
    page: int
    limit: int
    activities: list[ActivityOutSchema]
    coordenadorias: list[str]
    projetos: list[str]
