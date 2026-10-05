"""Server-side cart."""

import uuid

from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    SmallInteger,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps, UUIDPrimaryKey


class CartItem(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            "selected_color",
            "custom_note",
            postgresql_nulls_not_distinct=True,
        ),
        CheckConstraint("quantity BETWEEN 1 AND 20", name="quantity"),
        CheckConstraint(
            "custom_note IS NULL OR char_length(custom_note) <= 30", name="custom_note_length"
        ),
        Index("ix_cart_items_product_id", "product_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.products.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    selected_color: Mapped[str | None] = mapped_column(Text)
    custom_note: Mapped[str | None] = mapped_column(Text)
