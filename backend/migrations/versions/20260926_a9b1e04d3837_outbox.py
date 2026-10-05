"""outbox: notifications + NOTIFY trigger

Revision ID: a9b1e04d3837
Revises: e9131262d36e
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from migrations.sqlhelpers_v1 import (
    ADMIN,
    ANY_ACTOR,
    SYSTEM,
    execute,
    secure_table,
)

# revision identifiers, used by Alembic.
revision: str = "a9b1e04d3837"
down_revision: str | Sequence[str] | None = "e9131262d36e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NOTIFY_TRIGGER = (
    "CREATE TRIGGER trg_notifications_notify AFTER INSERT ON bloomcraft.notifications "
    "FOR EACH ROW EXECUTE FUNCTION bloomcraft.notify_outbox()"
)


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "notifications",
        sa.Column("recipient_user_id", sa.Uuid(), nullable=True),
        sa.Column("channel", sa.Text(), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("lane", sa.Text(), nullable=False),
        sa.Column("dedupe_key", sa.Text(), nullable=False),
        sa.Column("destination", sa.LargeBinary(), nullable=True),
        sa.Column("payload", sa.LargeBinary(), nullable=False),
        sa.Column("status", sa.Text(), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("max_attempts", sa.Integer(), server_default=sa.text("8"), nullable=False),
        sa.Column(
            "next_attempt_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("locked_by", sa.Text(), nullable=True),
        sa.Column("provider", sa.Text(), nullable=True),
        sa.Column("provider_message_id", sa.Text(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("related_type", sa.Text(), nullable=True),
        sa.Column("related_id", sa.Uuid(), nullable=True),
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
            "channel IN ('email', 'whatsapp', 'sms')", name=op.f("ck_notifications_channel")
        ),
        sa.CheckConstraint(
            "lane IN ('auth', 'transactional', 'bulk')", name=op.f("ck_notifications_lane")
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'sending', 'sent', 'failed', 'dead', 'skipped')",
            name=op.f("ck_notifications_status"),
        ),
        sa.CheckConstraint(
            "attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts",
            name=op.f("ck_notifications_attempts"),
        ),
        sa.CheckConstraint(
            "recipient_user_id IS NOT NULL OR destination IS NOT NULL",
            name=op.f("ck_notifications_has_recipient"),
        ),
        sa.ForeignKeyConstraint(
            ["recipient_user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_notifications_recipient_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
        sa.UniqueConstraint("dedupe_key", name=op.f("uq_notifications_dedupe_key")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_notifications_due",
        "notifications",
        ["lane", "next_attempt_at"],
        unique=False,
        schema="bloomcraft",
        postgresql_where=sa.text("status IN ('pending', 'failed')"),
    )
    op.create_index(
        "ix_notifications_recipient_user_id",
        "notifications",
        ["recipient_user_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "notifications",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "any": ANY_ACTOR,
            },
            "UPDATE": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "DELETE": {
                "system": SYSTEM,
            },
        },
    )
    execute(NOTIFY_TRIGGER)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("notifications", schema="bloomcraft")
