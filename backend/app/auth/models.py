"""Identity & access tables (PLAN §1.7)."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    PrimaryKeyConstraint,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.crypto.blind_index import BlindIndexKind
from app.db.base import Base, Timestamps, UUIDPrimaryKey, one_of
from app.db.types import encrypted_json, encrypted_text

USERS_ID = "bloomcraft.users.id"

ROLES = ("customer", "seller", "admin")
USER_STATUSES = ("active", "suspended", "blacklisted", "deleted")
CREATED_VIA = ("password", "google", "bootstrap_cli")
GRANT_STATUSES = ("active", "pending", "suspended", "revoked", "rejected")
GRANTED_VIA = ("signup", "application", "invite", "bootstrap", "admin")
OAUTH_PROVIDERS = ("google",)
OAUTH_INTENTS = ("login", "register")
VERIFICATION_PURPOSES = ("register_email", "phone_verify", "email_change")
TOKEN_PURPOSES = ("password_reset", "email_change_confirm")
BLOCKED_KINDS = ("email", "phone", "google_sub")


class User(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "users"
    __table_args__ = (
        one_of("status", USER_STATUSES),
        one_of("created_via", CREATED_VIA),
        CheckConstraint("(email IS NULL) = (email_bidx IS NULL)", name="email_bidx_pair"),
        CheckConstraint("email IS NOT NULL OR anonymized_at IS NOT NULL", name="email_required"),
        CheckConstraint("(phone IS NULL) = (phone_bidx IS NULL)", name="phone_bidx_pair"),
        CheckConstraint(
            "phone_verified_at IS NULL OR phone_bidx IS NOT NULL", name="phone_verified_needs_phone"
        ),
        CheckConstraint("failed_login_count >= 0", name="failed_login_count"),
        CheckConstraint(
            "created_via = 'bootstrap_cli' OR (consent_terms_version IS NOT NULL "
            "AND consent_privacy_version IS NOT NULL AND consent_at IS NOT NULL)",
            name="consent_required",
        ),
        Index(
            "uq_users_phone_bidx_verified",
            "phone_bidx",
            unique=True,
            postgresql_where=text("phone_verified_at IS NOT NULL"),
        ),
        Index("ix_users_phone_bidx", "phone_bidx"),
        Index(
            "ix_users_full_name_trgm",
            "full_name",
            postgresql_using="gin",
            postgresql_ops={"full_name": "gin_trgm_ops"},
        ),
    )

    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    email_ct: Mapped[bytes | None] = mapped_column("email", LargeBinary)
    email_bidx: Mapped[bytes | None] = mapped_column(LargeBinary, unique=True)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    phone_ct: Mapped[bytes | None] = mapped_column("phone", LargeBinary)
    phone_bidx: Mapped[bytes | None] = mapped_column(LargeBinary)
    phone_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    password_hash: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'active'"))
    failed_login_count: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mfa_totp_secret_ct: Mapped[bytes | None] = mapped_column("mfa_totp_secret", LargeBinary)
    mfa_enabled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    mfa_last_step: Mapped[int | None] = mapped_column(BigInteger)
    whatsapp_opt_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    consent_terms_version: Mapped[str | None] = mapped_column(Text)
    consent_privacy_version: Mapped[str | None] = mapped_column(Text)
    consent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notification_prefs: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )
    created_via: Mapped[str] = mapped_column(Text, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    anonymized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    email = encrypted_text("email_ct", bidx=("email_bidx", "email"))
    phone = encrypted_text("phone_ct", bidx=("phone_bidx", "phone"))
    mfa_totp_secret = encrypted_text("mfa_totp_secret_ct")


class UserRole(Timestamps, Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "role"),
        one_of("role", ROLES),
        one_of("status", GRANT_STATUSES),
        one_of("granted_via", GRANTED_VIA),
        Index("ix_user_roles_decided_by", "decided_by"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT"), nullable=False
    )
    role: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    granted_via: Mapped[str] = mapped_column(Text, nullable=False)
    decided_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT")
    )
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str | None] = mapped_column(Text)


class OAuthIdentity(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "oauth_identities"
    __table_args__ = (
        UniqueConstraint("provider", "subject"),
        UniqueConstraint("user_id", "provider"),
        one_of("provider", OAUTH_PROVIDERS),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    email_at_link_ct: Mapped[bytes] = mapped_column("email_at_link", LargeBinary, nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    email_at_link = encrypted_text("email_at_link_ct")


class Session(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "sessions"
    __table_args__ = (
        one_of("active_role", ROLES),
        CheckConstraint(
            "user_agent IS NULL OR char_length(user_agent) <= 200", name="user_agent_length"
        ),
        Index("ix_sessions_user_id", "user_id"),
        Index(
            "ix_sessions_user_id_live",
            "user_id",
            "absolute_expires_at",
            postgresql_where=text("revoked_at IS NULL"),
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, unique=True)
    active_role: Mapped[str] = mapped_column(Text, nullable=False)
    mfa_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    idle_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    absolute_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoke_reason: Mapped[str | None] = mapped_column(Text)
    ip_hmac: Mapped[bytes | None] = mapped_column(LargeBinary)
    user_agent: Mapped[str | None] = mapped_column(Text)


class AdminInvitation(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "admin_invitations"
    __table_args__ = (
        Index("ix_admin_invitations_email_bidx", "email_bidx"),
        Index("ix_admin_invitations_invited_by", "invited_by"),
        Index("ix_admin_invitations_accepted_user_id", "accepted_user_id"),
    )

    email_ct: Mapped[bytes] = mapped_column("email", LargeBinary, nullable=False)
    email_bidx: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, unique=True)
    invited_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT"), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    accepted_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT")
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    email = encrypted_text("email_ct", bidx=("email_bidx", "email"))


class OAuthTransaction(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "oauth_transactions"
    __table_args__ = (
        one_of("intent", OAUTH_INTENTS),
        one_of("requested_role", ROLES),
        Index("ix_oauth_transactions_invite_id", "invite_id"),
        Index("ix_oauth_transactions_expires_at", "expires_at"),
    )

    state_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, unique=True)
    browser_binding_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nonce_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    code_verifier_ct: Mapped[bytes] = mapped_column("code_verifier", LargeBinary, nullable=False)
    intent: Mapped[str] = mapped_column(Text, nullable=False)
    requested_role: Mapped[str] = mapped_column(Text, nullable=False)
    invite_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.admin_invitations.id", ondelete="RESTRICT")
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    code_verifier = encrypted_text("code_verifier_ct")


class PendingSignup(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "pending_signups"
    __table_args__ = (
        one_of("provider", OAUTH_PROVIDERS),
        one_of("requested_role", ROLES),
        CheckConstraint("attempts >= 0", name="attempts"),
        Index("ix_pending_signups_invite_id", "invite_id"),
        Index("ix_pending_signups_expires_at", "expires_at"),
    )

    token_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, unique=True)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    profile_ct: Mapped[bytes] = mapped_column("profile", LargeBinary, nullable=False)
    requested_role: Mapped[str] = mapped_column(Text, nullable=False)
    invite_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.admin_invitations.id", ondelete="RESTRICT")
    )
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    profile = encrypted_json("profile_ct")


def _challenge_target_kind(challenge: Any) -> BlindIndexKind:
    purpose = challenge.purpose
    if purpose is None:
        raise ValueError("verification_challenges.purpose must be set before target")
    return "phone" if purpose == "phone_verify" else "email"


class VerificationChallenge(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "verification_challenges"
    __table_args__ = (
        one_of("purpose", VERIFICATION_PURPOSES),
        CheckConstraint(
            "attempts >= 0 AND max_attempts > 0 AND attempts <= max_attempts", name="attempts"
        ),
        CheckConstraint("send_count >= 1", name="send_count"),
        Index(
            "uq_verification_challenges_live_target",
            "purpose",
            "target_bidx",
            unique=True,
            postgresql_where=text("consumed_at IS NULL"),
        ),
        Index("ix_verification_challenges_user_id", "user_id"),
    )

    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="CASCADE")
    )
    target_ct: Mapped[bytes] = mapped_column("target", LargeBinary, nullable=False)
    target_bidx: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    code_hmac: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("5"))
    send_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("1"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    target = encrypted_text("target_ct", bidx=("target_bidx", _challenge_target_kind))


class OneTimeToken(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "one_time_tokens"
    __table_args__ = (
        one_of("purpose", TOKEN_PURPOSES),
        Index("ix_one_time_tokens_user_id", "user_id"),
    )

    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class MfaRecoveryCode(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "mfa_recovery_codes"
    __table_args__ = (Index("ix_mfa_recovery_codes_user_id", "user_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="CASCADE"), nullable=False
    )
    code_hash: Mapped[str] = mapped_column(Text, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class BlockedIdentifier(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "blocked_identifiers"
    __table_args__ = (
        UniqueConstraint("kind", "value_bidx"),
        one_of("kind", BLOCKED_KINDS),
        Index("ix_blocked_identifiers_blocked_by", "blocked_by"),
    )

    kind: Mapped[str] = mapped_column(Text, nullable=False)
    value_bidx: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    blocked_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey(USERS_ID, ondelete="RESTRICT")
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
