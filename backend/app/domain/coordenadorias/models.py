import uuid
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base, TimestampMixin

class Coordenadoria(Base, TimestampMixin):
    __tablename__ = "coordenadorias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    emails: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
