"""identity: users, grants, sessions, auth tables, addresses, seller profiles

Revision ID: 1d48f513bc2c
Revises: a7834655c4bc
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from migrations.sqlhelpers_v1 import (
    ADMIN,
    SYSTEM,
    execute,
    own,
    secure_table,
)

# revision identifiers, used by Alembic.
revision: str = "1d48f513bc2c"
down_revision: str | Sequence[str] | None = "a7834655c4bc"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SELLER_APPLICATION = (
    f"{own('user_id')} AND role = 'seller' AND status = 'pending' AND granted_via = 'application'"
)

# Login-only (A15), no personal columns. Owned by the migrator (BYPASSRLS), so it reads past
# RLS by design: catalog and checkout join through it because RLS hides other people's
# users / user_roles / seller_profiles rows from customers.
STOREFRONT_SELLERS = """
CREATE VIEW bloomcraft.storefront_sellers WITH (security_barrier = true) AS
SELECT sp.user_id AS seller_id, sp.shop_name, sp.slug, sp.bio, sp.accepting_orders,
       sp.default_lead_time_days
FROM bloomcraft.seller_profiles sp
JOIN bloomcraft.users u ON u.id = sp.user_id
JOIN bloomcraft.user_roles r ON r.user_id = sp.user_id AND r.role = 'seller'
WHERE u.status = 'active' AND r.status = 'active' AND bloomcraft.actor_role() <> 'none'
"""


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("email", sa.LargeBinary(), nullable=True),
        sa.Column("email_bidx", sa.LargeBinary(), nullable=True),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("phone", sa.LargeBinary(), nullable=True),
        sa.Column("phone_bidx", sa.LargeBinary(), nullable=True),
        sa.Column("phone_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), server_default=sa.text("'active'"), nullable=False),
        sa.Column("failed_login_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("mfa_totp_secret", sa.LargeBinary(), nullable=True),
        sa.Column("mfa_enabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("mfa_last_step", sa.BigInteger(), nullable=True),
        sa.Column("whatsapp_opt_in_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("consent_terms_version", sa.Text(), nullable=True),
        sa.Column("consent_privacy_version", sa.Text(), nullable=True),
        sa.Column("consent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "notification_prefs",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("created_via", sa.Text(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("anonymized_at", sa.DateTime(timezone=True), nullable=True),
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
            "created_via = 'bootstrap_cli' OR (consent_terms_version IS NOT NULL AND "
            "consent_privacy_version IS NOT NULL AND consent_at IS NOT NULL)",
            name=op.f("ck_users_consent_required"),
        ),
        sa.CheckConstraint(
            "created_via IN ('password', 'google', 'bootstrap_cli')",
            name=op.f("ck_users_created_via"),
        ),
        sa.CheckConstraint(
            "status IN ('active', 'suspended', 'blacklisted', 'deleted')",
            name=op.f("ck_users_status"),
        ),
        sa.CheckConstraint(
            "(email IS NULL) = (email_bidx IS NULL)", name=op.f("ck_users_email_bidx_pair")
        ),
        sa.CheckConstraint(
            "(phone IS NULL) = (phone_bidx IS NULL)", name=op.f("ck_users_phone_bidx_pair")
        ),
        sa.CheckConstraint(
            "email IS NOT NULL OR anonymized_at IS NOT NULL", name=op.f("ck_users_email_required")
        ),
        sa.CheckConstraint("failed_login_count >= 0", name=op.f("ck_users_failed_login_count")),
        sa.CheckConstraint(
            "phone_verified_at IS NULL OR phone_bidx IS NOT NULL",
            name=op.f("ck_users_phone_verified_needs_phone"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email_bidx", name=op.f("uq_users_email_bidx")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_users_full_name_trgm",
        "users",
        ["full_name"],
        unique=False,
        schema="bloomcraft",
        postgresql_using="gin",
        postgresql_ops={"full_name": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_users_phone_bidx", "users", ["phone_bidx"], unique=False, schema="bloomcraft"
    )
    op.create_index(
        "uq_users_phone_bidx_verified",
        "users",
        ["phone_bidx"],
        unique=True,
        schema="bloomcraft",
        postgresql_where=sa.text("phone_verified_at IS NOT NULL"),
    )
    secure_table(
        "users",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "own": own("id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "system": SYSTEM,
            },
            "UPDATE": {
                "own": own("id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("granted_via", sa.Text(), nullable=False),
        sa.Column("decided_by", sa.Uuid(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
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
            "granted_via IN ('signup', 'application', 'invite', 'bootstrap', 'admin')",
            name=op.f("ck_user_roles_granted_via"),
        ),
        sa.CheckConstraint(
            "role IN ('customer', 'seller', 'admin')", name=op.f("ck_user_roles_role")
        ),
        sa.CheckConstraint(
            "status IN ('active', 'pending', 'suspended', 'revoked', 'rejected')",
            name=op.f("ck_user_roles_status"),
        ),
        sa.ForeignKeyConstraint(
            ["decided_by"],
            ["bloomcraft.users.id"],
            name=op.f("fk_user_roles_decided_by_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_user_roles_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("user_id", "role", name=op.f("pk_user_roles")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_user_roles_decided_by", "user_roles", ["decided_by"], unique=False, schema="bloomcraft"
    )
    secure_table(
        "user_roles",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "own": SELLER_APPLICATION,
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "UPDATE": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    op.create_table(
        "oauth_identities",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("email_at_link", sa.LargeBinary(), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.CheckConstraint("provider IN ('google')", name=op.f("ck_oauth_identities_provider")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_oauth_identities_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_oauth_identities")),
        sa.UniqueConstraint(
            "provider", "subject", name=op.f("uq_oauth_identities_provider_subject")
        ),
        sa.UniqueConstraint(
            "user_id", "provider", name=op.f("uq_oauth_identities_user_id_provider")
        ),
        schema="bloomcraft",
    )
    secure_table(
        "oauth_identities",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "system": SYSTEM,
            },
            "UPDATE": {
                "system": SYSTEM,
            },
            "DELETE": {
                "own": own("user_id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    op.create_table(
        "sessions",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.LargeBinary(), nullable=False),
        sa.Column("active_role", sa.Text(), nullable=False),
        sa.Column("mfa_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("idle_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("absolute_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoke_reason", sa.Text(), nullable=True),
        sa.Column("ip_hmac", sa.LargeBinary(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
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
            "active_role IN ('customer', 'seller', 'admin')", name=op.f("ck_sessions_active_role")
        ),
        sa.CheckConstraint(
            "user_agent IS NULL OR char_length(user_agent) <= 200",
            name=op.f("ck_sessions_user_agent_length"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_sessions_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sessions")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_sessions_token_hash")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_sessions_user_id", "sessions", ["user_id"], unique=False, schema="bloomcraft"
    )
    op.create_index(
        "ix_sessions_user_id_live",
        "sessions",
        ["user_id", "absolute_expires_at"],
        unique=False,
        schema="bloomcraft",
        postgresql_where=sa.text("revoked_at IS NULL"),
    )
    secure_table(
        "sessions",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "INSERT": {
                "system": SYSTEM,
            },
            "UPDATE": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "DELETE": {
                "system": SYSTEM,
            },
        },
    )
    op.create_table(
        "admin_invitations",
        sa.Column("email", sa.LargeBinary(), nullable=False),
        sa.Column("email_bidx", sa.LargeBinary(), nullable=False),
        sa.Column("token_hash", sa.LargeBinary(), nullable=False),
        sa.Column("invited_by", sa.Uuid(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("accepted_user_id", sa.Uuid(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["accepted_user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_admin_invitations_accepted_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["invited_by"],
            ["bloomcraft.users.id"],
            name=op.f("fk_admin_invitations_invited_by_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_admin_invitations")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_admin_invitations_token_hash")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_admin_invitations_accepted_user_id",
        "admin_invitations",
        ["accepted_user_id"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_admin_invitations_email_bidx",
        "admin_invitations",
        ["email_bidx"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_admin_invitations_invited_by",
        "admin_invitations",
        ["invited_by"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "admin_invitations",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "UPDATE": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    op.create_table(
        "oauth_transactions",
        sa.Column("state_hash", sa.LargeBinary(), nullable=False),
        sa.Column("browser_binding_hash", sa.LargeBinary(), nullable=False),
        sa.Column("nonce_hash", sa.LargeBinary(), nullable=False),
        sa.Column("code_verifier", sa.LargeBinary(), nullable=False),
        sa.Column("intent", sa.Text(), nullable=False),
        sa.Column("requested_role", sa.Text(), nullable=False),
        sa.Column("invite_id", sa.Uuid(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
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
            "intent IN ('login', 'register')", name=op.f("ck_oauth_transactions_intent")
        ),
        sa.CheckConstraint(
            "requested_role IN ('customer', 'seller', 'admin')",
            name=op.f("ck_oauth_transactions_requested_role"),
        ),
        sa.ForeignKeyConstraint(
            ["invite_id"],
            ["bloomcraft.admin_invitations.id"],
            name=op.f("fk_oauth_transactions_invite_id_admin_invitations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_oauth_transactions")),
        sa.UniqueConstraint("state_hash", name=op.f("uq_oauth_transactions_state_hash")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_oauth_transactions_expires_at",
        "oauth_transactions",
        ["expires_at"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_oauth_transactions_invite_id",
        "oauth_transactions",
        ["invite_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "oauth_transactions",
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
    )
    op.create_table(
        "pending_signups",
        sa.Column("token_hash", sa.LargeBinary(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("profile", sa.LargeBinary(), nullable=False),
        sa.Column("requested_role", sa.Text(), nullable=False),
        sa.Column("invite_id", sa.Uuid(), nullable=True),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.CheckConstraint("provider IN ('google')", name=op.f("ck_pending_signups_provider")),
        sa.CheckConstraint(
            "requested_role IN ('customer', 'seller', 'admin')",
            name=op.f("ck_pending_signups_requested_role"),
        ),
        sa.CheckConstraint("attempts >= 0", name=op.f("ck_pending_signups_attempts")),
        sa.ForeignKeyConstraint(
            ["invite_id"],
            ["bloomcraft.admin_invitations.id"],
            name=op.f("fk_pending_signups_invite_id_admin_invitations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pending_signups")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_pending_signups_token_hash")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_pending_signups_expires_at",
        "pending_signups",
        ["expires_at"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_pending_signups_invite_id",
        "pending_signups",
        ["invite_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "pending_signups",
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
    )
    op.create_table(
        "verification_challenges",
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("target", sa.LargeBinary(), nullable=False),
        sa.Column("target_bidx", sa.LargeBinary(), nullable=False),
        sa.Column("code_hmac", sa.LargeBinary(), nullable=False),
        sa.Column("attempts", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("max_attempts", sa.Integer(), server_default=sa.text("5"), nullable=False),
        sa.Column("send_count", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
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
            "purpose IN ('register_email', 'phone_verify', 'email_change')",
            name=op.f("ck_verification_challenges_purpose"),
        ),
        sa.CheckConstraint(
            "attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts",
            name=op.f("ck_verification_challenges_attempts"),
        ),
        sa.CheckConstraint("send_count >= 1", name=op.f("ck_verification_challenges_send_count")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_verification_challenges_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_verification_challenges")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_verification_challenges_user_id",
        "verification_challenges",
        ["user_id"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "uq_verification_challenges_live_target",
        "verification_challenges",
        ["purpose", "target_bidx"],
        unique=True,
        schema="bloomcraft",
        postgresql_where=sa.text("consumed_at IS NULL"),
    )
    secure_table(
        "verification_challenges",
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
    )
    op.create_table(
        "one_time_tokens",
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.LargeBinary(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
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
            "purpose IN ('password_reset', 'email_change_confirm')",
            name=op.f("ck_one_time_tokens_purpose"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_one_time_tokens_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_one_time_tokens")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_one_time_tokens_token_hash")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_one_time_tokens_user_id",
        "one_time_tokens",
        ["user_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "one_time_tokens",
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
    )
    op.create_table(
        "mfa_recovery_codes",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("code_hash", sa.Text(), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_mfa_recovery_codes_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mfa_recovery_codes")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_mfa_recovery_codes_user_id",
        "mfa_recovery_codes",
        ["user_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "mfa_recovery_codes",
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
    )
    op.create_table(
        "blocked_identifiers",
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("value_bidx", sa.LargeBinary(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("blocked_by", sa.Uuid(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
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
            "kind IN ('email', 'phone', 'google_sub')", name=op.f("ck_blocked_identifiers_kind")
        ),
        sa.ForeignKeyConstraint(
            ["blocked_by"],
            ["bloomcraft.users.id"],
            name=op.f("fk_blocked_identifiers_blocked_by_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_blocked_identifiers")),
        sa.UniqueConstraint(
            "kind", "value_bidx", name=op.f("uq_blocked_identifiers_kind_value_bidx")
        ),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_blocked_identifiers_blocked_by",
        "blocked_identifiers",
        ["blocked_by"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "blocked_identifiers",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "UPDATE": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "DELETE": {
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    op.create_table(
        "addresses",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("label", sa.Text(), nullable=True),
        sa.Column("recipient_name", sa.LargeBinary(), nullable=False),
        sa.Column("phone", sa.LargeBinary(), nullable=False),
        sa.Column("address", sa.LargeBinary(), nullable=False),
        sa.Column("city", sa.Text(), nullable=False),
        sa.Column("state", sa.Text(), nullable=False),
        sa.Column("pincode", sa.Text(), nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("false"), nullable=False),
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
        sa.CheckConstraint("pincode ~ '^[1-9][0-9]{5}$'", name=op.f("ck_addresses_pincode_format")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_addresses_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_addresses")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_addresses_user_id", "addresses", ["user_id"], unique=False, schema="bloomcraft"
    )
    op.create_index(
        "uq_addresses_user_id_default",
        "addresses",
        ["user_id"],
        unique=True,
        schema="bloomcraft",
        postgresql_where=sa.text("is_default"),
    )
    secure_table(
        "addresses",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "admin": ADMIN,
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
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    op.create_table(
        "seller_profiles",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("shop_name", sa.Text(), nullable=False),
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("contact_whatsapp", sa.LargeBinary(), nullable=True),
        sa.Column("notify_email", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("notify_whatsapp", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("accepting_orders", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "default_lead_time_days", sa.SmallInteger(), server_default=sa.text("3"), nullable=False
        ),
        sa.Column("application_note", sa.Text(), nullable=True),
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
            "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'", name=op.f("ck_seller_profiles_slug_format")
        ),
        sa.CheckConstraint(
            "default_lead_time_days BETWEEN 0 AND 90",
            name=op.f("ck_seller_profiles_default_lead_time_days"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_seller_profiles_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_seller_profiles")),
        sa.UniqueConstraint("slug", name=op.f("uq_seller_profiles_slug")),
        schema="bloomcraft",
    )
    secure_table(
        "seller_profiles",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "own": own("user_id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "UPDATE": {
                "own": own("user_id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    execute(
        STOREFRONT_SELLERS, "GRANT SELECT ON TABLE bloomcraft.storefront_sellers TO bloomcraft_app"
    )


def downgrade() -> None:
    """Downgrade schema."""
    execute("DROP VIEW bloomcraft.storefront_sellers")
    op.drop_table("seller_profiles", schema="bloomcraft")
    op.drop_table("addresses", schema="bloomcraft")
    op.drop_table("blocked_identifiers", schema="bloomcraft")
    op.drop_table("mfa_recovery_codes", schema="bloomcraft")
    op.drop_table("one_time_tokens", schema="bloomcraft")
    op.drop_table("verification_challenges", schema="bloomcraft")
    op.drop_table("pending_signups", schema="bloomcraft")
    op.drop_table("oauth_transactions", schema="bloomcraft")
    op.drop_table("admin_invitations", schema="bloomcraft")
    op.drop_table("sessions", schema="bloomcraft")
    op.drop_table("oauth_identities", schema="bloomcraft")
    op.drop_table("user_roles", schema="bloomcraft")
    op.drop_table("users", schema="bloomcraft")
