"""platform: store settings, audit log, rate-limit buckets

Revision ID: 8001a271159c
Revises: a9b1e04d3837
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from migrations.sqlhelpers_v1 import (
    ADMIN,
    EVERYONE,
    SYSTEM,
    execute,
    secure_table,
)

# revision identifiers, used by Alembic.
revision: str = "8001a271159c"
down_revision: str | Sequence[str] | None = "a9b1e04d3837"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# The only SECURITY DEFINER function: retention needs deletes, but the app never gets DELETE on
# audit_log. Phase 4's maintenance job calls it.
PURGE_AUDIT_LOG = """
CREATE FUNCTION bloomcraft.purge_audit_log(retain_days integer) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $fn$
DECLARE
  deleted bigint;
BEGIN
  IF retain_days IS NULL OR retain_days < 365 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'retain_days must be at least 365';
  END IF;
  DELETE FROM bloomcraft.audit_log WHERE occurred_at < now() - make_interval(days => retain_days);
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END
$fn$
"""
PURGE_AUDIT_LOG_GRANTS = (
    "REVOKE ALL ON FUNCTION bloomcraft.purge_audit_log(integer) FROM PUBLIC",
    "GRANT EXECUTE ON FUNCTION bloomcraft.purge_audit_log(integer) TO bloomcraft_app",
)


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "store_settings",
        sa.Column(
            "id",
            sa.SmallInteger(),
            server_default=sa.text("1"),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column(
            "config",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Uuid(), nullable=True),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
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
        sa.CheckConstraint("id = 1", name=op.f("ck_store_settings_singleton")),
        sa.ForeignKeyConstraint(
            ["updated_by"],
            ["bloomcraft.users.id"],
            name=op.f("fk_store_settings_updated_by_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_store_settings")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_store_settings_updated_by",
        "store_settings",
        ["updated_by"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "store_settings",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "everyone": EVERYONE,
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
    op.create_table(
        "audit_log",
        sa.Column("id", sa.BigInteger(), sa.Identity(always=True), nullable=False),
        sa.Column(
            "occurred_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("actor_role", sa.Text(), nullable=True),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("target_type", sa.Text(), nullable=True),
        sa.Column("target_id", sa.Text(), nullable=True),
        sa.Column("outcome", sa.Text(), nullable=False),
        sa.Column("ip_hmac", sa.LargeBinary(), nullable=True),
        sa.Column("request_id", sa.Uuid(), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "actor_role IN ('customer', 'seller', 'admin', 'system')",
            name=op.f("ck_audit_log_actor_role"),
        ),
        sa.CheckConstraint(
            "outcome IN ('success', 'denied', 'failure')", name=op.f("ck_audit_log_outcome")
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_audit_log_actor_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_audit_log")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_audit_log_actor_user_id",
        "audit_log",
        ["actor_user_id"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_audit_log_occurred_at", "audit_log", ["occurred_at"], unique=False, schema="bloomcraft"
    )
    op.create_index(
        "ix_audit_log_target_type_target_id",
        "audit_log",
        ["target_type", "target_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "audit_log",
        ["SELECT", "INSERT"],
        {
            "SELECT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "everyone": EVERYONE,
            },
        },
        touch=False,
    )
    execute(PURGE_AUDIT_LOG, *PURGE_AUDIT_LOG_GRANTS)
    op.create_table(
        "rate_limit_buckets",
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.CheckConstraint("count >= 0", name=op.f("ck_rate_limit_buckets_count")),
        sa.PrimaryKeyConstraint("key", "window_start", name=op.f("pk_rate_limit_buckets")),
        schema="bloomcraft",
        prefixes=["UNLOGGED"],
    )
    op.create_index(
        "ix_rate_limit_buckets_window_start",
        "rate_limit_buckets",
        ["window_start"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "rate_limit_buckets",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "system": SYSTEM,
            },
            "INSERT": {
                "system": SYSTEM,
            },
            "UPDATE": {
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
    op.drop_table("rate_limit_buckets", schema="bloomcraft")
    op.drop_table("audit_log", schema="bloomcraft")
    op.drop_table("store_settings", schema="bloomcraft")
    execute("DROP FUNCTION bloomcraft.purge_audit_log(integer)")
