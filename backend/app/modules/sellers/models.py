"""Seller profiles and the login-only ``storefront_sellers`` view."""

import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    LargeBinary,
    SmallInteger,
    Table,
    Text,
    Uuid,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps
from app.db.types import encrypted_text


class SellerProfile(Timestamps, Base):
    __tablename__ = "seller_profiles"
    __table_args__ = (
        CheckConstraint("slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name="slug_format"),
        CheckConstraint("default_lead_time_days BETWEEN 0 AND 90", name="default_lead_time_days"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT"), primary_key=True
    )
    shop_name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    bio: Mapped[str | None] = mapped_column(Text)
    contact_whatsapp_ct: Mapped[bytes | None] = mapped_column("contact_whatsapp", LargeBinary)
    notify_email: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notify_whatsapp: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    accepting_orders: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    default_lead_time_days: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default=text("3")
    )
    application_note: Mapped[str | None] = mapped_column(Text)

    contact_whatsapp = encrypted_text("contact_whatsapp_ct")


# Read-only view (created by migration 0e of Phase 2). Owned by the migrator, so it reads past
# RLS by design; it exposes no personal columns and returns rows only to signed-in actors.
storefront_sellers = Table(
    "storefront_sellers",
    Base.metadata,
    Column("seller_id", Uuid, primary_key=True),
    Column("shop_name", Text),
    Column("slug", Text),
    Column("bio", Text),
    Column("accepting_orders", Boolean),
    Column("default_lead_time_days", SmallInteger),
    info={"is_view": True},
)
