import uuid

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.actor import Actor
from app.db.actor import set_actor, system_context
from app.db.session import transaction
from app.modules.audit.models import AuditLog
from app.modules.audit.writer import record_audit

pytestmark = pytest.mark.db


async def _visible(factory: async_sessionmaker[AsyncSession], actor: Actor | None) -> int:
    async with transaction(factory) as session:
        await set_actor(session, actor)
        return int(await session.scalar(select(func.count()).select_from(AuditLog)) or 0)


async def test_insert_without_actor_visible_to_admin_and_system_only(
    app_sessionmaker: async_sessionmaker[AsyncSession],
) -> None:
    async with transaction(app_sessionmaker) as session:
        await set_actor(session, None)
        await record_audit(
            session,
            action="auth.login_failed",
            outcome="failure",
            target_type="user",
            metadata={"attempts": 3},
            ip="203.0.113.7",
        )
    someone = uuid.uuid7()
    assert await _visible(app_sessionmaker, None) == 0
    assert await _visible(app_sessionmaker, Actor(someone, "customer")) == 0
    assert await _visible(app_sessionmaker, Actor(someone, "seller")) == 0
    assert await _visible(app_sessionmaker, Actor(someone, "admin")) == 1
    async with transaction(app_sessionmaker) as session:
        await set_actor(session, None)
        async with system_context(session, "tests: read audit"):
            row = (await session.execute(select(AuditLog))).scalar_one()
    assert (row.action, row.outcome, row.metadata_) == (
        "auth.login_failed",
        "failure",
        {"attempts": 3},
    )
    assert row.ip_hmac is not None and len(row.ip_hmac) == 32
    assert row.request_id is None
