"""The outbox (``notifications``).

Write-only for request actors: rows are inserted with Core ``insert()`` and no RETURNING
(PostgreSQL rejects RETURNING a row the actor can't SELECT), deduplicated with
``ON CONFLICT DO NOTHING`` *without* a conflict target (a target makes PostgreSQL apply the
SELECT policies). ``destination`` is empty for account holders: the worker resolves the
address at send time.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    Text,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps, UUIDPrimaryKey, core_insert_only, one_of
from app.db.types import encrypted_json, encrypted_text

CHANNELS = ("email", "whatsapp", "sms")
LANES = ("auth", "transactional", "bulk")
NOTIFICATION_STATUSES = ("pending", "sending", "sent", "failed", "dead", "skipped")


@core_insert_only
class Notification(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        one_of("channel", CHANNELS),
        one_of("lane", LANES),
        one_of("status", NOTIFICATION_STATUSES),
        CheckConstraint(
            "recipient_user_id IS NOT NULL OR destination IS NOT NULL", name="has_recipient"
        ),
        CheckConstraint(
            "attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts", name="attempts"
        ),
        Index(
            "ix_notifications_due",
            "lane",
            "next_attempt_at",
            postgresql_where=text("status IN ('pending', 'failed')"),
        ),
        Index("ix_notifications_recipient_user_id", "recipient_user_id"),
        {"implicit_returning": False},
    )
    __mapper_args__ = {"eager_defaults": False}  # noqa: RUF012

    recipient_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT")
    )
    channel: Mapped[str] = mapped_column(Text, nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    lane: Mapped[str] = mapped_column(Text, nullable=False)
    dedupe_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    destination_ct: Mapped[bytes | None] = mapped_column("destination", LargeBinary)
    payload_ct: Mapped[bytes] = mapped_column("payload", LargeBinary, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'pending'"))
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("8"))
    next_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    locked_by: Mapped[str | None] = mapped_column(Text)
    provider: Mapped[str | None] = mapped_column(Text)
    provider_message_id: Mapped[str | None] = mapped_column(Text)
    last_error: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    related_type: Mapped[str | None] = mapped_column(Text)
    related_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)

    destination = encrypted_text("destination_ct")
    payload = encrypted_json("payload_ct")
