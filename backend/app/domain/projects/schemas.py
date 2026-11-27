from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ActivitySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    source_row_key: str | None = None
    mrae: str | None = None
    instrument: str | None = None
    clause: str | None = None
    phase: str | None = None
    thematic_group: str | None = None
    nature: str | None = None
    description: str
    prior_step: str | None = None
    prior_step_deadline: date | None = None
    prior_step_deadline_text: str | None = None
    primary_responsible: str | None = None
    sei_number: str | None = None
    department: list[str] | None = None
    contractual_deadline_text: str | None = None
    periodicity: str | None = None
    start_date: date | None = None
    initial_deadline_text: str | None = None
    deadline: date | None = None
    final_deadline_text: str | None = None
    working_days: int | None = None
    new_date: date | None = None
    status: str
    observations: str | None = None
    object_summary: str | None = None
    arpe_entry_date: date | None = None
    arpe_final_date: date | None = None
    arpe_status: str | None = None
    sei_2: str | None = None
    summary: str | None = None

    group_item: str | None = None
    contract: str | None = None
    contract_url: str | None = None
    step_number: str | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None
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


class SyncStatusOut(BaseModel):
    can_sync_now: bool
    cooldown_seconds: int
    retry_after_seconds: int
    next_allowed_at: datetime | None = None
    last_sync_at: datetime | None = None
    last_sync_by: str | None = None
    last_sync_items: int | None = None


class ActivityOutSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    project_name: str
    source_row_key: str | None = None
    mrae: str | None = None
    instrument: str | None = None
    clause: str | None = None
    phase: str | None = None
    thematic_group: str | None = None
    nature: str | None = None
    description: str
    prior_step: str | None = None
    prior_step_deadline: date | None = None
    prior_step_deadline_text: str | None = None
    primary_responsible: str | None = None
    sei_number: str | None = None
    department: list[str] | None = None
    contractual_deadline_text: str | None = None
    periodicity: str | None = None
    start_date: date | None = None
    initial_deadline_text: str | None = None
    deadline: date | None = None
    final_deadline_text: str | None = None
    working_days: int | None = None
    new_date: date | None = None
    status: str
    observations: str | None = None
    object_summary: str | None = None
    arpe_entry_date: date | None = None
    arpe_final_date: date | None = None
    arpe_status: str | None = None
    sei_2: str | None = None
    summary: str | None = None
    group_item: str | None = None
    contract: str | None = None
    contract_url: str | None = None
    contract_links: list[dict[str, str | None]] = Field(default_factory=list)
    step_number: str | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    delay_justification_problem: str | None = None
    delay_justification_action: str | None = None
    delay_justification_responsible: str | None = None
    created_at: datetime
    updated_at: datetime


class ActivityKpisOut(BaseModel):
    total: int = 0
    concluidas: int = 0
    atrasadas: int = 0
    em_andamento: int = 0
    a_iniciar: int = 0


class PaginatedActivitiesOut(BaseModel):
    total: int
    page: int
    limit: int
    activities: list[ActivityOutSchema]
    kpis: ActivityKpisOut = Field(default_factory=ActivityKpisOut)
    coordenadorias: list[str]
    projetos: list[str]
    mraes: list[str] = Field(default_factory=list)
    instrumentos: list[str] = Field(default_factory=list)
    executores: list[str] = Field(default_factory=list)
