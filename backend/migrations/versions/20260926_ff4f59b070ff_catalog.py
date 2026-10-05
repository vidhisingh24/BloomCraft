"""catalog: categories, products, images, wishlist, cart

Revision ID: ff4f59b070ff
Revises: 1d48f513bc2c
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from migrations.sqlhelpers_v1 import (
    SYSTEM,
    drop_guard_function,
    guard_trigger,
    own,
    secure_table,
)

# revision identifiers, used by Alembic.
revision: str = "ff4f59b070ff"
down_revision: str | Sequence[str] | None = "1d48f513bc2c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "categories",
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name=op.f("ck_categories_slug_format")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_categories")),
        sa.UniqueConstraint("slug", name=op.f("uq_categories_slug")),
        schema="bloomcraft",
    )
    secure_table(
        "categories",
        ["SELECT", "INSERT", "UPDATE"],
    )
    op.create_table(
        "products",
        sa.Column("seller_id", sa.Uuid(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=False),
        sa.Column("sku", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_paise", sa.Integer(), nullable=False),
        sa.Column("compare_at_price_paise", sa.Integer(), nullable=True),
        sa.Column("keychain_type", sa.Text(), nullable=True),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.Text()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
        sa.Column(
            "colors",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("availability", sa.Text(), server_default=sa.text("'in_stock'"), nullable=False),
        sa.Column("stock_qty", sa.Integer(), nullable=True),
        sa.Column(
            "max_qty_per_order", sa.SmallInteger(), server_default=sa.text("20"), nullable=False
        ),
        sa.Column(
            "making_time_days", sa.SmallInteger(), server_default=sa.text("0"), nullable=False
        ),
        sa.Column("is_customizable", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("yarn_type", sa.Text(), nullable=True),
        sa.Column("dimensions", sa.Text(), nullable=True),
        sa.Column("stems_count", sa.SmallInteger(), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("featured_rank", sa.SmallInteger(), nullable=True),
        sa.Column("status", sa.Text(), server_default=sa.text("'draft'"), nullable=False),
        sa.Column(
            "search",
            postgresql.TSVECTOR(),
            sa.Computed(
                "to_tsvector('english'::regconfig, coalesce(name, '') || ' ' || "
                "coalesce(short_description, '') || ' ' || coalesce(description, '') || ' ' || "
                "bloomcraft.immutable_tags_text(tags))",
                persisted=True,
            ),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "availability IN ('in_stock', 'made_to_order', 'out_of_stock')",
            name=op.f("ck_products_availability"),
        ),
        sa.CheckConstraint(
            "keychain_type IN ('tulip', 'daisy', 'rose', 'others')",
            name=op.f("ck_products_keychain_type"),
        ),
        sa.CheckConstraint(
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name=op.f("ck_products_slug_format")
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'active', 'archived', 'removed')", name=op.f("ck_products_status")
        ),
        sa.CheckConstraint(
            "compare_at_price_paise IS NULL OR compare_at_price_paise > price_paise",
            name=op.f("ck_products_compare_at_price_paise"),
        ),
        sa.CheckConstraint(
            "description IS NULL OR char_length(description) <= 2000",
            name=op.f("ck_products_description_length"),
        ),
        sa.CheckConstraint("making_time_days >= 0", name=op.f("ck_products_making_time_days")),
        sa.CheckConstraint(
            "max_qty_per_order BETWEEN 1 AND 20", name=op.f("ck_products_max_qty_per_order")
        ),
        sa.CheckConstraint("price_paise > 0", name=op.f("ck_products_price_paise")),
        sa.CheckConstraint(
            "stems_count IS NULL OR stems_count > 0", name=op.f("ck_products_stems_count")
        ),
        sa.CheckConstraint(
            "stock_qty IS NULL OR stock_qty >= 0", name=op.f("ck_products_stock_qty")
        ),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["bloomcraft.categories.id"],
            name=op.f("fk_products_category_id_categories"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["seller_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_products_seller_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_products")),
        sa.UniqueConstraint("sku", name=op.f("uq_products_sku")),
        sa.UniqueConstraint("slug", name=op.f("uq_products_slug")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_products_category_id_status",
        "products",
        ["category_id", "status"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_products_search",
        "products",
        ["search"],
        unique=False,
        schema="bloomcraft",
        postgresql_using="gin",
    )
    op.create_index(
        "ix_products_seller_id_status",
        "products",
        ["seller_id", "status"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "products",
        ["SELECT", "INSERT", "UPDATE"],
    )
    guard_trigger("products", [("seller_id", "r = 'system'")])
    op.create_table(
        "product_images",
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column(
            "variants",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.LargeBinary(), nullable=False),
        sa.Column("alt_text", sa.Text(), nullable=True),
        sa.Column("sort_order", sa.SmallInteger(), server_default=sa.text("0"), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("bytes > 0", name=op.f("ck_product_images_bytes")),
        sa.CheckConstraint(
            "octet_length(sha256) = 32", name=op.f("ck_product_images_sha256_length")
        ),
        sa.CheckConstraint("width > 0 AND height > 0", name=op.f("ck_product_images_dimensions")),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["bloomcraft.products.id"],
            name=op.f("fk_product_images_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_product_images")),
        sa.UniqueConstraint("storage_key", name=op.f("uq_product_images_storage_key")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_product_images_product_id_sort_order",
        "product_images",
        ["product_id", "sort_order"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "product_images",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
    )
    op.create_table(
        "wishlist_items",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["bloomcraft.products.id"],
            name=op.f("fk_wishlist_items_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_wishlist_items_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("user_id", "product_id", name=op.f("pk_wishlist_items")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_wishlist_items_product_id",
        "wishlist_items",
        ["product_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "wishlist_items",
        ["SELECT", "INSERT", "DELETE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "INSERT": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "DELETE": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
        },
        touch=False,
    )
    op.create_table(
        "cart_items",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.SmallInteger(), nullable=False),
        sa.Column("selected_color", sa.Text(), nullable=True),
        sa.Column("custom_note", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "custom_note IS NULL OR char_length(custom_note) <= 30",
            name=op.f("ck_cart_items_custom_note_length"),
        ),
        sa.CheckConstraint("quantity BETWEEN 1 AND 20", name=op.f("ck_cart_items_quantity")),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["bloomcraft.products.id"],
            name=op.f("fk_cart_items_product_id_products"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_cart_items_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cart_items")),
        sa.UniqueConstraint(
            "user_id",
            "product_id",
            "selected_color",
            "custom_note",
            name=op.f("uq_cart_items_user_id_product_id_selected_color_custom_note"),
            postgresql_nulls_not_distinct=True,
        ),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_cart_items_product_id", "cart_items", ["product_id"], unique=False, schema="bloomcraft"
    )
    secure_table(
        "cart_items",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "INSERT": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "UPDATE": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "DELETE": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
        },
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("cart_items", schema="bloomcraft")
    op.drop_table("wishlist_items", schema="bloomcraft")
    op.drop_table("product_images", schema="bloomcraft")
    op.drop_table("products", schema="bloomcraft")
    op.drop_table("categories", schema="bloomcraft")
    drop_guard_function("products")
