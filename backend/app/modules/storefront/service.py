"""Store settings access. Callers own the transaction and the actor context."""

import uuid

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User, UserRole
from app.modules.audit.writer import record_audit
from app.modules.sellers.models import SellerProfile
from app.modules.storefront.models import StoreSettings
from app.modules.storefront.store_config import StoreConfig

SETTINGS_ID = 1


async def _settings_row(session: AsyncSession) -> StoreSettings | None:
    return await session.get(StoreSettings, SETTINGS_ID)


async def load_store_config(session: AsyncSession) -> tuple[StoreConfig, int] | None:
    """(config, version), or None when the row is missing. An invalid stored config raises
    ``pydantic.ValidationError``."""
    row = await _settings_row(session)
    if row is None:
        return None
    return StoreConfig.model_validate(row.config), row.version


async def active_seller_ids(session: AsyncSession) -> list[uuid.UUID]:
    """Users with an active seller grant, an active account and a seller profile."""
    rows = await session.execute(
        select(UserRole.user_id)
        .join(User, User.id == UserRole.user_id)
        .join(SellerProfile, SellerProfile.user_id == UserRole.user_id)
        .where(
            UserRole.role == "seller",
            UserRole.status == "active",
            User.status == "active",
            User.anonymized_at.is_(None),
        )
        .order_by(UserRole.user_id)
    )
    return list(rows.scalars())


async def ensure_default_custom_request_seller(session: AsyncSession) -> uuid.UUID | None:
    """A31 — "the founding seller initially": when the settings row exists, its default seller
    is empty and exactly one seller qualifies, make that seller the default. Returns the seller
    id when it was set, else None."""
    row = await _settings_row(session)
    if row is None:
        return None
    try:
        config = StoreConfig.model_validate(row.config)
    except ValidationError:
        return None
    if config.default_custom_request_seller_id is not None:
        return None
    sellers = await active_seller_ids(session)
    if len(sellers) != 1:
        return None
    seller_id = sellers[0]
    updated = StoreConfig.model_validate(
        {**config.model_dump(mode="json"), "default_custom_request_seller_id": str(seller_id)}
    )
    row.config = updated.model_dump(mode="json")
    await session.flush()  # the ORM bumps ``version`` (version_id_col)
    await record_audit(
        session,
        action="store_settings.default_seller_set",
        actor_role="system",
        target_type="store_settings",
        target_id=str(SETTINGS_ID),
        metadata={"seller_id": str(seller_id)},
    )
    return seller_id
