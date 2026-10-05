"""Categories, products and product images (no RLS: no personal data; visibility and seller
write isolation are enforced in the services, Phases 7-8)."""

import uuid
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Computed,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    SmallInteger,
    Text,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps, UUIDPrimaryKey, one_of, version_column

KEYCHAIN_TYPES = ("tulip", "daisy", "rose", "others")
AVAILABILITY = ("in_stock", "made_to_order", "out_of_stock")
PRODUCT_STATUSES = ("draft", "active", "archived", "removed")

# STORED: PostgreSQL 18 makes generated columns VIRTUAL by default, and those can't be indexed.
PRODUCT_SEARCH_EXPRESSION = (
    "to_tsvector('english'::regconfig, "
    "coalesce(name, '') || ' ' || coalesce(short_description, '') || ' ' || "
    "coalesce(description, '') || ' ' || bloomcraft.immutable_tags_text(tags))"
)


class Category(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "categories"
    __table_args__ = (CheckConstraint("slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name="slug_format"),)

    slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))


class Product(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "products"
    __table_args__ = (
        one_of("keychain_type", KEYCHAIN_TYPES),
        one_of("availability", AVAILABILITY),
        one_of("status", PRODUCT_STATUSES),
        CheckConstraint("slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name="slug_format"),
        CheckConstraint("price_paise > 0", name="price_paise"),
        CheckConstraint(
            "compare_at_price_paise IS NULL OR compare_at_price_paise > price_paise",
            name="compare_at_price_paise",
        ),
        CheckConstraint("stock_qty IS NULL OR stock_qty >= 0", name="stock_qty"),
        CheckConstraint("max_qty_per_order BETWEEN 1 AND 20", name="max_qty_per_order"),
        CheckConstraint("making_time_days >= 0", name="making_time_days"),
        CheckConstraint("stems_count IS NULL OR stems_count > 0", name="stems_count"),
        CheckConstraint(
            "description IS NULL OR char_length(description) <= 2000", name="description_length"
        ),
        Index("ix_products_search", "search", postgresql_using="gin"),
        Index("ix_products_category_id_status", "category_id", "status"),
        Index("ix_products_seller_id_status", "seller_id", "status"),
    )

    seller_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT"), nullable=False
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.categories.id", ondelete="RESTRICT"), nullable=False
    )
    sku: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    short_description: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    price_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    compare_at_price_paise: Mapped[int | None] = mapped_column(Integer)
    keychain_type: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'::text[]")
    )
    colors: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )
    availability: Mapped[str] = mapped_column(
        Text, nullable=False, server_default=text("'in_stock'")
    )
    stock_qty: Mapped[int | None] = mapped_column(Integer)
    max_qty_per_order: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default=text("20")
    )
    making_time_days: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, server_default=text("0")
    )
    is_customizable: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    yarn_type: Mapped[str | None] = mapped_column(Text)
    dimensions: Mapped[str | None] = mapped_column(Text)
    stems_count: Mapped[int | None] = mapped_column(SmallInteger)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    featured_rank: Mapped[int | None] = mapped_column(SmallInteger)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'draft'"))
    search: Mapped[Any] = mapped_column(
        TSVECTOR, Computed(PRODUCT_SEARCH_EXPRESSION, persisted=True)
    )
    version: Mapped[int] = version_column()

    __mapper_args__ = {"version_id_col": version}  # noqa: RUF012


class ProductImage(UUIDPrimaryKey, Timestamps, Base):
    """Max 8 per product (service rule)."""

    __tablename__ = "product_images"
    __table_args__ = (
        CheckConstraint("width > 0 AND height > 0", name="dimensions"),
        CheckConstraint("bytes > 0", name="bytes"),
        CheckConstraint("octet_length(sha256) = 32", name="sha256_length"),
        Index("ix_product_images_product_id_sort_order", "product_id", "sort_order"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.products.id", ondelete="CASCADE"), nullable=False
    )
    storage_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    variants: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    size_bytes: Mapped[int] = mapped_column("bytes", Integer, nullable=False)
    sha256: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    alt_text: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("0"))
