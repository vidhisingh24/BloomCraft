"""Coupons, coupon redemptions and idempotency records."""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
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
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAt, Timestamps, UUIDPrimaryKey, one_of
from app.db.types import encrypted_json

COUPON_TYPES = ("percentage", "flat")
IDEMPOTENCY_STATES = ("in_progress", "completed")


class Coupon(UUIDPrimaryKey, Timestamps, Base):
    """``times_redeemed`` is the usage counter: checkout locks the coupon row ``FOR UPDATE``
    (under RLS a customer can count only their own redemptions)."""

    __tablename__ = "coupons"
    __table_args__ = (
        one_of("type", COUPON_TYPES),
        CheckConstraint("code = upper(code) AND char_length(code) BETWEEN 3 AND 32", name="code"),
        CheckConstraint("value > 0 AND (type <> 'percentage' OR value <= 100)", name="value"),
        CheckConstraint("min_order_paise >= 0", name="min_order_paise"),
        CheckConstraint(
            "max_discount_paise IS NULL OR max_discount_paise >= 0", name="max_discount_paise"
        ),
        CheckConstraint(
            "starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at", name="window"
        ),
        CheckConstraint(
            "usage_limit_total IS NULL OR usage_limit_total > 0", name="usage_limit_total"
        ),
        CheckConstraint(
            "usage_limit_per_user IS NULL OR usage_limit_per_user > 0",
            name="usage_limit_per_user",
        ),
        CheckConstraint(
            "times_redeemed >= 0 AND (usage_limit_total IS NULL "
            "OR times_redeemed <= usage_limit_total)",
            name="times_redeemed",
        ),
        CheckConstraint(
            "description IS NULL OR char_length(description) BETWEEN 1 AND 200",
            name="description",
        ),
    )

    code: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    type: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[int] = mapped_column(Integer, nullable=False)
    min_order_paise: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    max_discount_paise: Mapped[int | None] = mapped_column(Integer)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    usage_limit_total: Mapped[int | None] = mapped_column(Integer)
    usage_limit_per_user: Mapped[int | None] = mapped_column(Integer)
    first_order_only: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    times_redeemed: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    description: Mapped[str | None] = mapped_column(Text)  # shown when the code is applied


class CouponRedemption(UUIDPrimaryKey, CreatedAt, Base):
    __tablename__ = "coupon_redemptions"
    __table_args__ = (
        CheckConstraint("discount_paise >= 0", name="discount_paise"),
        Index("ix_coupon_redemptions_coupon_id_user_id", "coupon_id", "user_id"),
        Index("ix_coupon_redemptions_user_id", "user_id"),
    )

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.coupons.id", ondelete="RESTRICT"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT"), nullable=False
    )
    checkout_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False, unique=True)
    discount_paise: Mapped[int] = mapped_column(Integer, nullable=False)


class IdempotencyRecord(UUIDPrimaryKey, Timestamps, Base):
    """``response_body`` is encrypted: stored API responses can contain contact data."""

    __tablename__ = "idempotency_records"
    __table_args__ = (
        UniqueConstraint("user_id", "scope", "key"),
        one_of("state", IDEMPOTENCY_STATES),
        CheckConstraint("char_length(key) BETWEEN 1 AND 255", name="key_length"),
        CheckConstraint(
            "state <> 'completed' OR response_status IS NOT NULL", name="completed_response"
        ),
        Index("ix_idempotency_records_expires_at", "expires_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT"), nullable=False
    )
    scope: Mapped[str] = mapped_column(Text, nullable=False)
    key: Mapped[str] = mapped_column(Text, nullable=False)
    request_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    state: Mapped[str] = mapped_column(Text, nullable=False)
    response_status: Mapped[int | None] = mapped_column(SmallInteger)
    response_body_ct: Mapped[bytes | None] = mapped_column("response_body", LargeBinary)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    response_body = encrypted_json("response_body_ct")
