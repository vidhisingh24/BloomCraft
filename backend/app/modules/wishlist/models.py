"""Saved products."""

import uuid

from sqlalchemy import ForeignKey, Index, PrimaryKeyConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAt


class WishlistItem(CreatedAt, Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "product_id"),
        Index("ix_wishlist_items_product_id", "product_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.products.id", ondelete="CASCADE"), nullable=False
    )
