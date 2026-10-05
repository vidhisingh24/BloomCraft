"""First admin and founding seller (CLI only; identity creation stays in ``app.auth``).

Each command runs two transactions: ``plan_*`` (read only: preconditions, and whether a new
account — so a password — is needed) and ``create_*`` (advisory lock, the plan re-checked,
write). The password is read and hashed in between, with no transaction open. Callers run
both under ``system_context``.

CLI-created accounts are email-verified on the operator's word; no consent is recorded (the
``users`` CHECK allows that for ``created_via = 'bootstrap_cli'``).
"""

import re
import unicodedata
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import BlockedIdentifier, User, UserRole
from app.crypto.blind_index import blind_index, normalize_email
from app.modules.audit.writer import record_audit
from app.modules.sellers.models import SellerProfile
from app.modules.storefront.service import ensure_default_custom_request_seller

SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_SLUG_LENGTH = 40
BOOTSTRAP_LOCK_KEY = int.from_bytes(b"bc-bootstrap", "big") & 0x7FFF_FFFF_FFFF_FFFF
GRANT_REASON = "bootstrap-cli"


class BootstrapRefused(Exception):
    """A precondition failed; the message is safe to print."""


# ---- input cleaning -------------------------------------------------------------------------


def clean_email(raw: str, *, production: bool) -> str:
    try:
        result = validate_email(
            raw.strip(), check_deliverability=False, test_environment=not production
        )
    except EmailNotValidError as exc:
        raise BootstrapRefused(f"invalid email address: {exc}") from None
    return normalize_email(result.normalized)


def clean_text(raw: str, *, label: str, max_length: int) -> str:
    value = unicodedata.normalize("NFKC", raw).strip()
    if not 1 <= len(value) <= max_length:
        raise BootstrapRefused(f"{label} must be 1-{max_length} characters")
    if any(unicodedata.category(char) == "Cc" for char in value):
        raise BootstrapRefused(f"{label} must not contain control characters")
    return value


def derive_slug(shop_name: str) -> str:
    ascii_name = unicodedata.normalize("NFKD", shop_name).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_name.lower()).strip("-")
    return slug[:MAX_SLUG_LENGTH].strip("-")


def clean_slug(raw: str | None, shop_name: str) -> str:
    slug = derive_slug(shop_name) if raw is None else raw.strip()
    if not slug:
        raise BootstrapRefused("cannot derive a slug from the shop name; pass --slug")
    if len(slug) > MAX_SLUG_LENGTH or not SLUG_RE.fullmatch(slug):
        raise BootstrapRefused(
            f"slug must match {SLUG_RE.pattern} and be at most {MAX_SLUG_LENGTH} characters"
        )
    return slug


@dataclass(frozen=True, slots=True)
class AdminRequest:
    email: str
    full_name: str

    @classmethod
    def clean(cls, *, email: str, name: str, production: bool) -> AdminRequest:
        return cls(
            clean_email(email, production=production),
            clean_text(name, label="name", max_length=100),
        )


@dataclass(frozen=True, slots=True)
class SellerRequest:
    email: str
    full_name: str
    shop_name: str
    slug: str

    @classmethod
    def clean(
        cls, *, email: str, name: str, shop_name: str, slug: str | None, production: bool
    ) -> SellerRequest:
        shop = clean_text(shop_name, label="shop name", max_length=80)
        return cls(
            clean_email(email, production=production),
            clean_text(name, label="name", max_length=100),
            shop,
            clean_slug(slug, shop),
        )


@dataclass(frozen=True, slots=True)
class Plan:
    existing_user_id: uuid.UUID | None

    @property
    def needs_password(self) -> bool:
        return self.existing_user_id is None


@dataclass(frozen=True, slots=True)
class BootstrapResult:
    user_id: uuid.UUID
    created_account: bool


# ---- shared checks --------------------------------------------------------------------------


def _now() -> datetime:
    return datetime.now(UTC)


async def active_admin_count(session: AsyncSession) -> int:
    """Active admin grants on active, non-anonymised accounts."""
    count = await session.scalar(
        select(func.count())
        .select_from(UserRole)
        .join(User, User.id == UserRole.user_id)
        .where(
            UserRole.role == "admin",
            UserRole.status == "active",
            User.status == "active",
            User.anonymized_at.is_(None),
        )
    )
    return int(count or 0)


async def _account(session: AsyncSession, email: str) -> User | None:
    """The account for ``email``; refuses a blocked email or a non-active account."""
    blocked = await session.scalar(
        select(func.count())
        .select_from(BlockedIdentifier)
        .where(
            BlockedIdentifier.kind == "email",
            BlockedIdentifier.value_bidx == blind_index("email", email),
            or_(BlockedIdentifier.expires_at.is_(None), BlockedIdentifier.expires_at > func.now()),
        )
    )
    if blocked:
        raise BootstrapRefused("this email is blocked")
    user = (
        await session.execute(select(User).where(User.email_bidx == blind_index("email", email)))
    ).scalar_one_or_none()
    if user is not None and (user.status != "active" or user.anonymized_at is not None):
        status = "anonymized" if user.anonymized_at is not None else user.status
        raise BootstrapRefused(f"the existing account is {status}")
    return user


async def _grants(session: AsyncSession, user_id: uuid.UUID) -> dict[str, UserRole]:
    rows = await session.execute(select(UserRole).where(UserRole.user_id == user_id))
    return {grant.role: grant for grant in rows.scalars()}


async def _lock(session: AsyncSession) -> None:
    await session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": BOOTSTRAP_LOCK_KEY})


async def _new_user(session: AsyncSession, full_name: str, email: str, password_hash: str) -> User:
    user = User(
        full_name=full_name,
        status="active",
        created_via="bootstrap_cli",
        email_verified_at=_now(),
        password_hash=password_hash,
    )
    user.email = email
    session.add(user)
    await session.flush()
    return user


async def _grant(session: AsyncSession, user_id: uuid.UUID, role: str) -> None:
    """Add an active bootstrap grant, or reactivate an existing one."""
    grants = await _grants(session, user_id)
    existing = grants.get(role)
    if existing is None:
        session.add(
            UserRole(
                user_id=user_id,
                role=role,
                status="active",
                granted_via="bootstrap",
                decided_at=_now(),
                reason=GRANT_REASON,
            )
        )
    elif existing.status != "active":
        existing.status = "active"
        existing.granted_via = "bootstrap"
        existing.decided_at = _now()
        existing.reason = GRANT_REASON
    await session.flush()


# ---- admin ----------------------------------------------------------------------------------


async def plan_admin(session: AsyncSession, request: AdminRequest) -> Plan:
    user = await _account(session, request.email)
    if await active_admin_count(session) > 0:
        raise BootstrapRefused("an admin already exists — use invitations")
    return Plan(user.id if user else None)


async def create_admin(
    session: AsyncSession, request: AdminRequest, password_hash: str | None
) -> BootstrapResult:
    await _lock(session)
    plan = await plan_admin(session, request)
    if plan.existing_user_id is None:
        if password_hash is None:
            raise BootstrapRefused("a password is required for a new account")
        user_id = (await _new_user(session, request.full_name, request.email, password_hash)).id
    else:
        user_id = plan.existing_user_id  # credentials untouched
    await _grant(session, user_id, "customer")
    await _grant(session, user_id, "admin")
    await record_audit(
        session,
        action="bootstrap.create_admin",
        actor_role="system",
        target_type="user",
        target_id=str(user_id),
        metadata={"existing_account": plan.existing_user_id is not None},
    )
    return BootstrapResult(user_id, created_account=plan.existing_user_id is None)


# ---- seller ---------------------------------------------------------------------------------


async def plan_seller(session: AsyncSession, request: SellerRequest) -> Plan:
    user = await _account(session, request.email)
    if user is not None:
        seller = (await _grants(session, user.id)).get("seller")
        if seller is not None:
            if seller.status == "active":
                raise BootstrapRefused("this account is already a seller")
            raise BootstrapRefused(
                f"this account's seller grant is {seller.status} — decide it in the admin console"
            )
        if await session.get(SellerProfile, user.id) is not None:
            raise BootstrapRefused("this account already has a seller profile")
    taken = await session.scalar(
        select(func.count()).select_from(SellerProfile).where(SellerProfile.slug == request.slug)
    )
    if taken:
        raise BootstrapRefused(f"slug '{request.slug}' is taken; pass --slug")
    return Plan(user.id if user else None)


async def create_seller(
    session: AsyncSession, request: SellerRequest, password_hash: str | None
) -> BootstrapResult:
    await _lock(session)
    plan = await plan_seller(session, request)
    if plan.existing_user_id is None:
        if password_hash is None:
            raise BootstrapRefused("a password is required for a new account")
        user_id = (await _new_user(session, request.full_name, request.email, password_hash)).id
    else:
        user_id = plan.existing_user_id
    await _grant(session, user_id, "customer")
    await _grant(session, user_id, "seller")
    session.add(SellerProfile(user_id=user_id, shop_name=request.shop_name, slug=request.slug))
    await session.flush()
    await record_audit(
        session,
        action="bootstrap.create_seller",
        actor_role="system",
        target_type="user",
        target_id=str(user_id),
        metadata={"existing_account": plan.existing_user_id is not None, "slug": request.slug},
    )
    await ensure_default_custom_request_seller(session)
    return BootstrapResult(user_id, created_account=plan.existing_user_id is None)
