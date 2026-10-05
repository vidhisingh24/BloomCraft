"""Helpers for CliRunner tests: plain ``def`` tests (the CLI calls ``asyncio.run``), so reads and
fixture writes run in their own event loop with their own engines."""

import asyncio
from collections.abc import Awaitable, Callable, Sequence
from typing import Any

import pytest
from click.testing import Result
from sqlalchemy import NullPool, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from typer.testing import CliRunner

from app import cli
from app.core.config import Settings
from app.crypto import install_crypto
from app.db.actor import set_actor, system_context
from app.db.session import create_engine, create_sessionmaker, transaction


def invoke(
    monkeypatch: pytest.MonkeyPatch,
    settings: Settings,
    *args: str,
    input: str | None = None,
) -> Result:
    monkeypatch.setattr(cli, "get_settings", lambda: settings)
    return CliRunner().invoke(cli.app, list(args), input=input)


def query(settings: Settings, sql: str, **params: Any) -> Sequence[Any]:
    """Raw rows through the migrator (bypasses RLS)."""

    async def run() -> Sequence[Any]:
        assert settings.test_database_migrator_url is not None
        engine = create_async_engine(
            settings.test_database_migrator_url.get_secret_value(), poolclass=NullPool
        )
        try:
            async with engine.begin() as conn:
                result = await conn.execute(text(sql), params)
                return result.all() if result.returns_rows else []
        finally:
            await engine.dispose()

    return asyncio.run(run())


def as_system[T](settings: Settings, work: Callable[[AsyncSession], Awaitable[T]]) -> T:
    """Run ``work`` as the app role under system_context and commit."""

    async def run() -> T:
        install_crypto(settings)
        engine = create_engine(settings, application_name="bloomcraft-tests-cli")
        try:
            async with transaction(create_sessionmaker(engine)) as session:
                await set_actor(session, None)
                async with system_context(session, "tests: cli fixture"):
                    return await work(session)
        finally:
            await engine.dispose()

    return asyncio.run(run())
