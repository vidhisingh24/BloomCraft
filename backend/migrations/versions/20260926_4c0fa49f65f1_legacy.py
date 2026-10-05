"""legacy customers and import batches

Revision ID: 4c0fa49f65f1
Revises: ff4f59b070ff
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from migrations.sqlhelpers_v1 import (
    ADMIN,
    SYSTEM,
    secure_table,
)

# revision identifiers, used by Alembic.
revision: str = "4c0fa49f65f1"
down_revision: str | Sequence[str] | None = "ff4f59b070ff"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "legacy_import_batches",
        sa.Column("file_sha256", sa.LargeBinary(), nullable=False),
        sa.Column("operator", sa.Text(), nullable=False),
        sa.Column("dry_run", sa.Boolean(), nullable=False),
        sa.Column(
            "stats",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "octet_length(file_sha256) = 32",
            name=op.f("ck_legacy_import_batches_file_sha256_length"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_legacy_import_batches")),
        schema="bloomcraft",
    )
    secure_table(
        "legacy_import_batches",
        ["SELECT", "INSERT"],
        {
            "SELECT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "system": SYSTEM,
            },
        },
        touch=False,
    )
    op.create_table(
        "legacy_customers",
        sa.Column("legacy_ref", sa.Text(), nullable=False),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("email", sa.LargeBinary(), nullable=True),
        sa.Column("email_bidx", sa.LargeBinary(), nullable=True),
        sa.Column("phone", sa.LargeBinary(), nullable=True),
        sa.Column("phone_bidx", sa.LargeBinary(), nullable=True),
        sa.Column("city", sa.Text(), nullable=True),
        sa.Column("notes", sa.LargeBinary(), nullable=True),
        sa.Column("import_batch_id", sa.Uuid(), nullable=False),
        sa.Column("claimed_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
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
            "(claimed_by_user_id IS NULL) = (claimed_at IS NULL)",
            name=op.f("ck_legacy_customers_claim_pair"),
        ),
        sa.CheckConstraint(
            "(email IS NULL) = (email_bidx IS NULL)",
            name=op.f("ck_legacy_customers_email_bidx_pair"),
        ),
        sa.CheckConstraint(
            "(phone IS NULL) = (phone_bidx IS NULL)",
            name=op.f("ck_legacy_customers_phone_bidx_pair"),
        ),
        sa.ForeignKeyConstraint(
            ["claimed_by_user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_legacy_customers_claimed_by_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["import_batch_id"],
            ["bloomcraft.legacy_import_batches.id"],
            name=op.f("fk_legacy_customers_import_batch_id_legacy_import_batches"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_legacy_customers")),
        sa.UniqueConstraint("email_bidx", name=op.f("uq_legacy_customers_email_bidx")),
        sa.UniqueConstraint("legacy_ref", name=op.f("uq_legacy_customers_legacy_ref")),
        sa.UniqueConstraint("phone_bidx", name=op.f("uq_legacy_customers_phone_bidx")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_legacy_customers_claimed_by_user_id",
        "legacy_customers",
        ["claimed_by_user_id"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_legacy_customers_import_batch_id",
        "legacy_customers",
        ["import_batch_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "legacy_customers",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "system": SYSTEM,
            },
            "UPDATE": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("legacy_customers", schema="bloomcraft")
    op.drop_table("legacy_import_batches", schema="bloomcraft")
