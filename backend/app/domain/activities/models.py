import uuid
from datetime import date
from sqlalchemy import Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class Activity(Base, TimestampMixin):
    __tablename__ = "activities"
    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "source_row_key",
            name="uq_activities_project_source_row_key",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    source_row_key: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )

    # Identificação e classificação contratual (aba Concessão)
    mrae: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    instrument: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    clause: Mapped[str | None] = mapped_column(Text, nullable=True)
    phase: Mapped[str | None] = mapped_column(String(100), nullable=True)
    thematic_group: Mapped[str | None] = mapped_column(String(255), nullable=True)
    nature: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Ação principal e etapa prévia
    description: Mapped[str] = mapped_column(Text, nullable=False)
    prior_step: Mapped[str | None] = mapped_column(Text, nullable=True)
    prior_step_deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    prior_step_deadline_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Responsabilidade e execução
    primary_responsible: Mapped[str | None] = mapped_column(String(255), nullable=True)
    department: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # Prazos contratuais e datas híbridas (Date + texto original quando não é data)
    contractual_deadline_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    periodicity: Mapped[str | None] = mapped_column(String(150), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    initial_deadline_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    final_deadline_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    working_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Status, rastreabilidade e campos complementares da planilha
    status: Mapped[str] = mapped_column(String(50), default="A Iniciar")
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    sei_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    object_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    arpe_entry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    arpe_final_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    arpe_status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sei_2: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Campos legados mantidos para retrocompatibilidade
    group_item: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contract: Mapped[str | None] = mapped_column(String(255), nullable=True)
    step_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    delay_justification_problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    delay_justification_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    delay_justification_responsible: Mapped[str | None] = mapped_column(String(255), nullable=True)

    project: Mapped["Project"] = relationship("Project", back_populates="activities")
