"""custom requests and their images

Revision ID: e9131262d36e
Revises: 7ea8c0cc514a
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from migrations.sqlhelpers_v1 import (
    ACTOR,
    ADMIN,
    SYSTEM,
    as_role,
    drop_guard_function,
    guard_trigger,
    parent,
    secure_table,
)

# revision identifiers, used by Alembic.
revision: str = "e9131262d36e"
down_revision: str | Sequence[str] | None = "7ea8c0cc514a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CUSTOM_REQUEST_GUARD_RULES = [
    ("customer_id", "r = 'system'"),
    ("assigned_seller_id", "r IN ('admin', 'system')"),
]


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "custom_requests",
        sa.Column("request_number", sa.Text(), nullable=False),
        sa.Column("customer_id", sa.Uuid(), nullable=False),
        sa.Column("assigned_seller_id", sa.Uuid(), nullable=True),
        sa.Column("item_type", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "colors",
            postgresql.ARRAY(sa.Text()),
            server_default=sa.text("'{}'::text[]"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("budget_min_paise", sa.Integer(), nullable=True),
        sa.Column("budget_max_paise", sa.Integer(), nullable=True),
        sa.Column("needed_by", sa.Date(), nullable=True),
        sa.Column("occasion", sa.Text(), nullable=True),
        sa.Column("contact", sa.LargeBinary(), nullable=False),
        sa.Column("status", sa.Text(), server_default=sa.text("'received'"), nullable=False),
        sa.Column("quoted_price_paise", sa.Integer(), nullable=True),
        sa.Column("quote_note", sa.Text(), nullable=True),
        sa.Column("quoted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
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
            "request_number ~ '^CR-[0-9]{4}-[0-9A-HJKMNP-TV-Z]{6}$'",
            name=op.f("ck_custom_requests_request_number_format"),
        ),
        sa.CheckConstraint(
            "status IN ('received', 'quoted', 'accepted', 'in_progress', 'completed', 'declined', "
            "'cancelled')",
            name=op.f("ck_custom_requests_status"),
        ),
        sa.CheckConstraint(
            "budget_max_paise IS NULL OR budget_max_paise >= 0",
            name=op.f("ck_custom_requests_budget_max_paise"),
        ),
        sa.CheckConstraint(
            "budget_min_paise IS NULL OR budget_max_paise IS NULL OR budget_min_paise <= "
            "budget_max_paise",
            name=op.f("ck_custom_requests_budget_range"),
        ),
        sa.CheckConstraint(
            "budget_min_paise IS NULL OR budget_min_paise >= 0",
            name=op.f("ck_custom_requests_budget_min_paise"),
        ),
        sa.CheckConstraint(
            "char_length(description) <= 2000", name=op.f("ck_custom_requests_description_length")
        ),
        sa.CheckConstraint("quantity >= 1", name=op.f("ck_custom_requests_quantity")),
        sa.CheckConstraint(
            "quote_note IS NULL OR char_length(quote_note) <= 280",
            name=op.f("ck_custom_requests_quote_note_length"),
        ),
        sa.CheckConstraint(
            "quoted_price_paise IS NULL OR quoted_price_paise >= 0",
            name=op.f("ck_custom_requests_quoted_price_paise"),
        ),
        sa.ForeignKeyConstraint(
            ["assigned_seller_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_custom_requests_assigned_seller_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_custom_requests_customer_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_custom_requests")),
        sa.UniqueConstraint("request_number", name=op.f("uq_custom_requests_request_number")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_custom_requests_assigned_seller_id_status",
        "custom_requests",
        ["assigned_seller_id", "status"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_custom_requests_customer_id_created_at",
        "custom_requests",
        ["customer_id", "created_at"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "custom_requests",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "customer": as_role("customer", f"customer_id = {ACTOR}"),
                "seller": as_role("seller", f"assigned_seller_id = {ACTOR}"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "customer": as_role("customer", f"customer_id = {ACTOR}"),
                "system": SYSTEM,
            },
            "UPDATE": {
                "customer": as_role("customer", f"customer_id = {ACTOR}"),
                "seller": as_role("seller", f"assigned_seller_id = {ACTOR}"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    guard_trigger("custom_requests", CUSTOM_REQUEST_GUARD_RULES)
    op.create_table(
        "custom_request_images",
        sa.Column("custom_request_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column("mime", sa.Text(), nullable=False),
        sa.Column("bytes", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.LargeBinary(), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "mime IN ('image/jpeg', 'image/png', 'image/webp')",
            name=op.f("ck_custom_request_images_mime"),
        ),
        sa.CheckConstraint("bytes > 0", name=op.f("ck_custom_request_images_bytes")),
        sa.CheckConstraint(
            "octet_length(sha256) = 32", name=op.f("ck_custom_request_images_sha256_length")
        ),
        sa.CheckConstraint(
            "position BETWEEN 1 AND 3", name=op.f("ck_custom_request_images_position")
        ),
        sa.CheckConstraint(
            "width > 0 AND height > 0", name=op.f("ck_custom_request_images_dimensions")
        ),
        sa.ForeignKeyConstraint(
            ["custom_request_id"],
            ["bloomcraft.custom_requests.id"],
            name=op.f("fk_custom_request_images_custom_request_id_custom_requests"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_custom_request_images")),
        sa.UniqueConstraint(
            "custom_request_id",
            "position",
            name=op.f("uq_custom_request_images_custom_request_id_position"),
        ),
        sa.UniqueConstraint("storage_key", name=op.f("uq_custom_request_images_storage_key")),
        schema="bloomcraft",
    )
    secure_table(
        "custom_request_images",
        ["SELECT", "INSERT", "DELETE"],
        {
            "SELECT": {
                "parent": parent("custom_requests", "custom_request_id"),
            },
            "INSERT": {
                "customer": as_role("customer", parent("custom_requests", "custom_request_id")),
                "system": SYSTEM,
            },
            "DELETE": {
                "system": SYSTEM,
            },
        },
        touch=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("custom_request_images", schema="bloomcraft")
    op.drop_table("custom_requests", schema="bloomcraft")
    drop_guard_function("custom_requests")
