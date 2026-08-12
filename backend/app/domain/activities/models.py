import uuid
from datetime import date
from sqlalchemy import String, Date, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin

class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    sei_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    working_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Não Iniciado")
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    group_item: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contract: Mapped[str | None] = mapped_column(String(255), nullable=True)
    step_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    actual_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    delay_justification_problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    delay_justification_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    delay_justification_responsible: Mapped[str | None] = mapped_column(String(255), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="activities")
