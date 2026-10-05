"""Append-only audit log. The app role may INSERT and SELECT only; retention deletes go through
the ``bloomcraft.purge_audit_log`` definer function.

Insert with ``insert(AuditLog.__table__).inline().values(...)``: no RETURNING (request actors
can't SELECT the row) and no primary-key prefetch (without ``inline()`` SQLAlchemy calls
``nextval()`` on the identity sequence, which the app has no privilege for)."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    LargeBinary,
    Text,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, core_insert_only, one_of

AUDIT_ACTOR_ROLES = ("customer", "seller", "admin", "system")
AUDIT_OUTCOMES = ("success", "denied", "failure")


@core_insert_only
class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        one_of("actor_role", AUDIT_ACTOR_ROLES),
        one_of("outcome", AUDIT_OUTCOMES),
        Index("ix_audit_log_occurred_at", "occurred_at"),
        Index("ix_audit_log_actor_user_id", "actor_user_id"),
        Index("ix_audit_log_target_type_target_id", "target_type", "target_id"),
        {"implicit_returning": False},
    )
    __mapper_args__ = {"eager_defaults": False}  # noqa: RUF012

    id: Mapped[int] = mapped_column(BigInteger, Identity(always=True), primary_key=True)
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT")
    )
    actor_role: Mapped[str | None] = mapped_column(Text)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    target_type: Mapped[str | None] = mapped_column(Text)
    target_id: Mapped[str | None] = mapped_column(Text)
    outcome: Mapped[str] = mapped_column(Text, nullable=False)
    ip_hmac: Mapped[bytes | None] = mapped_column(LargeBinary)
    request_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    metadata_: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
