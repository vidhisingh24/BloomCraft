"""Saved delivery addresses."""

import uuid

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, LargeBinary, Text, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps, UUIDPrimaryKey
from app.db.types import encrypted_json, encrypted_text


class Address(UUIDPrimaryKey, Timestamps, Base):
    """At most one default per user (partial unique index); the 10-per-user cap is enforced in
    the service (Phase 7)."""

    __tablename__ = "addresses"
    __table_args__ = (
        CheckConstraint("pincode ~ '^[1-9][0-9]{5}$'", name="pincode_format"),
        Index("ix_addresses_user_id", "user_id"),
        Index(
            "uq_addresses_user_id_default",
            "user_id",
            unique=True,
            postgresql_where=text("is_default"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="CASCADE"), nullable=False
    )
    label: Mapped[str | None] = mapped_column(Text)
    recipient_name_ct: Mapped[bytes] = mapped_column("recipient_name", LargeBinary, nullable=False)
    phone_ct: Mapped[bytes] = mapped_column("phone", LargeBinary, nullable=False)
    address_ct: Mapped[bytes] = mapped_column("address", LargeBinary, nullable=False)
    city: Mapped[str] = mapped_column(Text, nullable=False)
    state: Mapped[str] = mapped_column(Text, nullable=False)
    pincode: Mapped[str] = mapped_column(Text, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    recipient_name = encrypted_text("recipient_name_ct")
    phone = encrypted_text("phone_ct")
    address = encrypted_json("address_ct")  # {house, street, area, landmark}
