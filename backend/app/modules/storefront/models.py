"""The singleton store configuration row."""

import uuid
from typing import Any

from sqlalchemy import CheckConstraint, ForeignKey, Index, SmallInteger, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps, version_column


class StoreSettings(Timestamps, Base):
    __tablename__ = "store_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="singleton"),
        Index("ix_store_settings_updated_by", "updated_by"),
    )

    id: Mapped[int] = mapped_column(
        SmallInteger, primary_key=True, autoincrement=False, server_default=text("1")
    )
    config: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT")
    )
    version: Mapped[int] = version_column()

    __mapper_args__ = {"version_id_col": version}  # noqa: RUF012
