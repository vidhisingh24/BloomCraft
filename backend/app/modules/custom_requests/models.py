"""Custom requests and their private reference photos."""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    SmallInteger,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAt, Timestamps, UUIDPrimaryKey, one_of, version_column
from app.db.types import encrypted_json

CUSTOM_REQUEST_STATUSES = (
    "received",
    "quoted",
    "accepted",
    "in_progress",
    "completed",
    "declined",
    "cancelled",
)
IMAGE_MIME_TYPES = ("image/jpeg", "image/png", "image/webp")


class CustomRequest(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "custom_requests"
    __table_args__ = (
        one_of("status", CUSTOM_REQUEST_STATUSES),
        CheckConstraint(
            "request_number ~ '^CR-[0-9]{4}-[0-9A-HJKMNP-TV-Z]{6}$'", name="request_number_format"
        ),
        CheckConstraint("char_length(description) <= 2000", name="description_length"),
        CheckConstraint("quantity >= 1", name="quantity"),
        CheckConstraint(
            "budget_min_paise IS NULL OR budget_min_paise >= 0", name="budget_min_paise"
        ),
        CheckConstraint(
            "budget_max_paise IS NULL OR budget_max_paise >= 0", name="budget_max_paise"
        ),
        CheckConstraint(
            "budget_min_paise IS NULL OR budget_max_paise IS NULL "
            "OR budget_min_paise <= budget_max_paise",
            name="budget_range",
        ),
        CheckConstraint(
            "quoted_price_paise IS NULL OR quoted_price_paise >= 0", name="quoted_price_paise"
        ),
        CheckConstraint(
            "quote_note IS NULL OR char_length(quote_note) <= 280", name="quote_note_length"
        ),
        Index("ix_custom_requests_customer_id_created_at", "customer_id", "created_at"),
        Index("ix_custom_requests_assigned_seller_id_status", "assigned_seller_id", "status"),
    )

    request_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT"), nullable=False
    )
    assigned_seller_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT")
    )
    item_type: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    colors: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'::text[]")
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    budget_min_paise: Mapped[int | None] = mapped_column(Integer)
    budget_max_paise: Mapped[int | None] = mapped_column(Integer)
    needed_by: Mapped[date | None] = mapped_column(Date)
    occasion: Mapped[str | None] = mapped_column(Text)
    contact_ct: Mapped[bytes] = mapped_column("contact", LargeBinary, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'received'"))
    quoted_price_paise: Mapped[int | None] = mapped_column(Integer)
    quote_note: Mapped[str | None] = mapped_column(Text)
    quoted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    version: Mapped[int] = version_column()

    __mapper_args__ = {"version_id_col": version}  # noqa: RUF012

    contact = encrypted_json("contact_ct")


class CustomRequestImage(UUIDPrimaryKey, CreatedAt, Base):
    """``position`` 1-3 + unique (request, position): the database enforces "max 3"."""

    __tablename__ = "custom_request_images"
    __table_args__ = (
        UniqueConstraint("custom_request_id", "position"),
        one_of("mime", IMAGE_MIME_TYPES),
        CheckConstraint("position BETWEEN 1 AND 3", name="position"),
        CheckConstraint("bytes > 0", name="bytes"),
        CheckConstraint("width > 0 AND height > 0", name="dimensions"),
        CheckConstraint("octet_length(sha256) = 32", name="sha256_length"),
    )

    custom_request_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.custom_requests.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    mime: Mapped[str] = mapped_column(Text, nullable=False)
    size_bytes: Mapped[int] = mapped_column("bytes", Integer, nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
