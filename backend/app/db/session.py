"""Async engine (asyncpg) and the unit of work.

Rules: one transaction per unit of work (request, CLI step, worker job); services never commit.
The RLS actor settings are transaction-local, so they vanish when a transaction ends — a second
transaction inside one request would run without an actor (and see nothing).
"""

import contextlib
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings
from app.core.request_context import get_actor
from app.db.actor import set_actor


def create_engine(
    settings: Settings,
    *,
    application_name: str = "bloomcraft-api",
    url: SecretStr | None = None,
) -> AsyncEngine:
    """An engine for the app role (DATABASE_URL unless ``url`` is given); the API, CLI, worker
    and tests never use the migrator DSN for data access.

    ``hide_parameters``: SQLAlchemy errors (and logged tracebacks) would otherwise carry the
    bound parameters — names, ciphertexts, password hashes."""
    dsn = url if url is not None else settings.database_url
    return create_async_engine(
        dsn.get_secret_value(),
        hide_parameters=True,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_pre_ping=True,
        connect_args={
            "server_settings": {
                "statement_timeout": str(settings.db_statement_timeout_ms),
                "application_name": application_name,
                "timezone": "UTC",
            }
        },
    )


def create_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


@contextlib.asynccontextmanager
async def transaction(factory: async_sessionmaker[AsyncSession]) -> AsyncIterator[AsyncSession]:
    """Begin → yield → commit; roll back on any error; always close."""
    session = factory()
    try:
        await session.begin()
        yield session
        await session.commit()
    except BaseException:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    """The request's unit of work, with the request's actor applied first."""
    factory: async_sessionmaker[AsyncSession] = request.app.state.sessionmaker
    async with transaction(factory) as session:
        await set_actor(session, get_actor())
        yield session


# scope="function": teardown (the commit) runs before the response is sent, so a failed
# commit surfaces as a 500 instead of an already-sent 200.
DbSession = Annotated[AsyncSession, Depends(get_db, scope="function")]
