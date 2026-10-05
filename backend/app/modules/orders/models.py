"""Orders (one per seller per checkout), their items and status timeline."""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
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

from app.db.base import Base, CreatedAt, Timestamps, UUIDPrimaryKey, one_of, version_column
from app.db.types import encrypted_json, encrypted_text

USERS_ID = "bloomcraft.users.id"
ORDER_SOURCES = ("web", "legacy_import")
ORDER_STATUSES = ("placed", "confirmed", "preparing", "ready", "shipped", "delivered", "cancelled")
PAYMENT_STATUSES = ("pending", "awaiting_verification", "paid", "failed", "refunded")
PAYMENT_METHODS = ("upi", "cod")
DELIVERY_METHODS = ("vadodara_local", "college", "parcel")
CANCEL_REASONS = ("customer_request", "seller_rejected", "admin")
EVENT_ACTOR_ROLES = ("customer", "seller", "admin", "system")
EVENT_VISIBILITY = ("customer", "internal")
MONEY_COLUMNS = (
    "subtotal_paise",
    "delivery_paise",
    "gift_wrap_paise",
    "discount_paise",
    "total_paise",
)


def _legacy_gap(column: str) -> CheckConstraint:
    return CheckConstraint(
        f"source = 'legacy_import' OR {column} IS NOT NULL", name=f"{column}_required"
    )


class Order(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "orders"
    __table_args__ = (
        one_of("source", ORDER_SOURCES),
        one_of("status", ORDER_STATUSES),
        one_of("payment_status", PAYMENT_STATUSES),
        one_of("payment_method", PAYMENT_METHODS),
        one_of("delivery_method", DELIVERY_METHODS),
        one_of("cancel_reason", CANCEL_REASONS),
        CheckConstraint(
            "order_number ~ '^BC-[0-9]{4}-[0-9A-HJKMNP-TV-Z]{6}$'", name="order_number_format"
        ),
        CheckConstraint(
            "customer_id IS NOT NULL OR legacy_customer_id IS NOT NULL", name="has_customer"
        ),
        CheckConstraint(
            "source = 'legacy_import' OR legacy_customer_id IS NULL", name="legacy_customer_source"
        ),
        CheckConstraint("source = 'legacy_import' OR legacy_ref IS NULL", name="legacy_ref_source"),
        CheckConstraint(
            "cancel_reason IS NULL OR status = 'cancelled'", name="cancel_reason_status"
        ),
        *(CheckConstraint(f"{c} >= 0", name=c) for c in MONEY_COLUMNS),
        CheckConstraint(
            "total_paise = subtotal_paise + delivery_paise + gift_wrap_paise - discount_paise",
            name="total_formula",
        ),
        _legacy_gap("checkout_id"),
        _legacy_gap("terms_version"),
        _legacy_gap("payment_method"),
        _legacy_gap("contact_phone"),
        _legacy_gap("contact_email"),
        Index("ix_orders_customer_id_placed_at", "customer_id", "placed_at"),
        Index("ix_orders_seller_id_status_placed_at", "seller_id", "status", "placed_at"),
        Index("ix_orders_checkout_id", "checkout_id"),
        Index("ix_orders_legacy_customer_id", "legacy_customer_id"),
        Index("ix_orders_payment_verified_by", "payment_verified_by"),
    )

    order_number: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    checkout_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT")
    )
    legacy_customer_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.legacy_customers.id", ondelete="RESTRICT")
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT"), nullable=False
    )
    source: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'web'"))
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'placed'"))
    cancel_reason: Mapped[str | None] = mapped_column(Text)
    delivery_method: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_details_ct: Mapped[bytes] = mapped_column(
        "delivery_details", LargeBinary, nullable=False
    )
    delivery_city: Mapped[str | None] = mapped_column(Text)
    delivery_pincode: Mapped[str | None] = mapped_column(Text)
    preferred_date: Mapped[date | None] = mapped_column(Date)
    contact_name_ct: Mapped[bytes] = mapped_column("contact_name", LargeBinary, nullable=False)
    contact_phone_ct: Mapped[bytes | None] = mapped_column("contact_phone", LargeBinary)
    contact_email_ct: Mapped[bytes | None] = mapped_column("contact_email", LargeBinary)
    subtotal_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    delivery_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    gift_wrap_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    discount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    total_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    gift_wrap_requested: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    gift_message_ct: Mapped[bytes | None] = mapped_column("gift_message", LargeBinary)
    coupon_code: Mapped[str | None] = mapped_column(Text)
    payment_method: Mapped[str | None] = mapped_column(Text)
    payment_status: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'pending'")
    )
    upi_txn_ref_ct: Mapped[bytes | None] = mapped_column("upi_txn_ref", LargeBinary)
    payment_verified_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT")
    )
    payment_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    shipment_carrier: Mapped[str | None] = mapped_column(Text)
    shipment_tracking_ref: Mapped[str | None] = mapped_column(Text)
    terms_version: Mapped[str | None] = mapped_column(Text)
    placed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    preparing_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    shipped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    legacy_ref: Mapped[str | None] = mapped_column(Text, unique=True)
    version: Mapped[int] = version_column()

    __mapper_args__ = {"version_id_col": version}  # noqa: RUF012

    delivery_details = encrypted_json("delivery_details_ct")
    contact_name = encrypted_text("contact_name_ct")
    contact_phone = encrypted_text("contact_phone_ct")
    contact_email = encrypted_text("contact_email_ct")
    gift_message = encrypted_text("gift_message_ct")
    upi_txn_ref = encrypted_text("upi_txn_ref_ct")


class OrderItem(UUIDPrimaryKey, CreatedAt, Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("unit_price_paise >= 0", name="unit_price_paise"),
        CheckConstraint("quantity >= 1", name="quantity"),
        CheckConstraint("line_total_paise = unit_price_paise * quantity", name="line_total"),
        CheckConstraint(
            "custom_note IS NULL OR char_length(custom_note) <= 30", name="custom_note_length"
        ),
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_product_id", "product_id"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.orders.id", ondelete="RESTRICT"), nullable=False
    )
    product_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.products.id", ondelete="SET NULL")
    )
    sku: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    image_key: Mapped[str | None] = mapped_column(Text)
    unit_price_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    selected_color: Mapped[str | None] = mapped_column(Text)
    custom_note: Mapped[str | None] = mapped_column(Text)


class OrderStatusEvent(UUIDPrimaryKey, CreatedAt, Base):
    """Append-only timeline; ``internal`` events are hidden from customers."""

    __tablename__ = "order_status_events"
    __table_args__ = (
        one_of("from_status", ORDER_STATUSES),
        one_of("to_status", ORDER_STATUSES),
        one_of("actor_role", EVENT_ACTOR_ROLES),
        one_of("visibility", EVENT_VISIBILITY),
        CheckConstraint("note IS NULL OR char_length(note) <= 280", name="note_length"),
        Index("ix_order_status_events_order_id_created_at", "order_id", "created_at"),
        Index("ix_order_status_events_actor_user_id", "actor_user_id"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.orders.id", ondelete="RESTRICT"), nullable=False
    )
    from_status: Mapped[str | None] = mapped_column(Text)
    to_status: Mapped[str] = mapped_column(Text, nullable=False)
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT")
    )
    actor_role: Mapped[str] = mapped_column(Text, nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    visibility: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'customer'"))
