import asyncio
from typing import Any

import asyncpg
import pytest
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.auth.models import User
from app.core.actor import Actor
from app.core.config import Settings
from app.db.actor import set_actor, system_context
from app.db.session import transaction
from tests.factories import create_user, insert_notification

pytestmark = pytest.mark.db


async def test_updated_at_moves_on_update(
    app_sessionmaker: async_sessionmaker[AsyncSession],
) -> None:
    async with transaction(app_sessionmaker) as s:
        await set_actor(s, None)
        async with system_context(s, "tests: create user"):
            user_id = (await create_user(s, full_name="Before", email="t1@example.test")).id

    async def timestamps() -> tuple[Any, Any]:
        async with transaction(app_sessionmaker) as s:
            await set_actor(s, None)
            async with system_context(s, "tests: read timestamps"):
                row = (
                    await s.execute(
                        select(User.created_at, User.updated_at).where(User.id == user_id)
                    )
                ).one()
        return row[0], row[1]

    created, first = await timestamps()
    async with transaction(app_sessionmaker) as s:
        await set_actor(s, Actor(user_id, "customer"))  # own row
        await s.execute(update(User).where(User.id == user_id).values(full_name="After"))
    created_again, second = await timestamps()
    assert created_again == created
    assert second > first


async def test_outbox_insert_notifies_listener(
    test_settings: Settings, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    dsn = test_settings.database_url.get_secret_value().replace("postgresql+asyncpg", "postgresql")
    listener = await asyncpg.connect(dsn)
    received: asyncio.Queue[tuple[str, str]] = asyncio.Queue()
    try:
        assert await listener.fetchval("SELECT current_user") == "bloomcraft_app"
        await listener.add_listener(
            "bc_outbox",
            lambda _conn, _pid, channel, payload: received.put_nowait((channel, payload)),
        )
        async with transaction(app_sessionmaker) as s:
            await set_actor(s, None)
            async with system_context(s, "tests: create user"):
                user_id = (await create_user(s, full_name="N", email="n@example.test")).id
        async with transaction(app_sessionmaker) as s:
            await set_actor(s, Actor(user_id, "customer"))
            await insert_notification(
                s, dedupe_key="notify:1", recipient=user_id, payload={"k": "v"}, lane="auth"
            )
            await asyncio.sleep(0.1)
            assert received.empty()  # delivered on commit, not before
        assert await asyncio.wait_for(received.get(), timeout=5) == ("bc_outbox", "auth")
    finally:
        await listener.close()
