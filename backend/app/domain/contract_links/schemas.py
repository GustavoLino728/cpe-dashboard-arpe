from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, HttpUrl


class ContractLinkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID | None = None
    project_id: UUID
    project_name: str
    contract: str
    url: str | None = None
    activities_count: int
    updated_at: datetime | None = None


class ContractLinkUpsert(BaseModel):
    project_id: UUID
    contract: str
    url: HttpUrl
