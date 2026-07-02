from pydantic import BaseModel
from datetime import date
from uuid import UUID

class ProjectSummarySchema(BaseModel):
    projeto: str
    data_referencia: date
    total_atividades: int
    concluidas: int
    em_andamento: int
    nao_iniciadas: int
    percentual_conclusao: float
    prazos_proximos_7_dias: int
    prazos_criticos_2_dias: int
    atrasadas: int

class PhaseStatusSchema(BaseModel):
    fase: str
    concluido: int
    em_andamento: int
    nao_iniciado: int

class SectorLoadSchema(BaseModel):
    setor: str
    total: int

class SectorStatusSchema(BaseModel):
    setor: str
    concluido: int
    em_andamento: int
    nao_iniciado: int

class CriticalActivitySchema(BaseModel):
    id: UUID
    descricao: str
    setor: str
    prazo_final: date | None = None
    status: str
    dias_para_prazo: int

class TimelineEventSchema(BaseModel):
    id: UUID
    descricao: str
    data_inicio: date | None = None
    prazo_final: date | None = None
    status: str
    fase: str
