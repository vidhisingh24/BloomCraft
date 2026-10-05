"""A data-only pg_dump of the fixture world contains none of the encrypted plaintexts."""

import asyncio
import os
import shutil
import subprocess

import pytest
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.db.actor import set_actor, system_context
from app.db.session import transaction
from tests.factories import build_world

pytestmark = pytest.mark.db


def pg_dump(settings: Settings) -> str:
    executable = shutil.which("pg_dump")
    if executable is None:
        pytest.skip("pg_dump is not on PATH")
    assert settings.test_database_migrator_url is not None
    url = make_url(settings.test_database_migrator_url.get_secret_value())
    env = {**os.environ, "PGPASSWORD": url.password or ""}  # never in argv
    result = subprocess.run(  # noqa: S603 - fixed argv, no shell
        [
            executable,
            "--data-only",
            "--schema=bloomcraft",
            "--no-password",
            "-h",
            url.host or "127.0.0.1",
            "-p",
            str(url.port or 5432),
            "-U",
            url.username or "",
            "-d",
            url.database or "",
        ],
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert result.returncode == 0, result.stderr[-2000:]
    return result.stdout


async def test_dump_contains_no_plaintext(
    test_settings: Settings, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with transaction(app_sessionmaker) as session:
        await set_actor(session, None)
        async with system_context(session, "tests: dump fixture data"):
            world = await build_world(session)
    dump = await asyncio.to_thread(pg_dump, test_settings)

    # the dump really holds the data: tables, and plaintext-by-design columns
    assert "COPY bloomcraft.users" in dump
    assert "COPY bloomcraft.orders" in dump
    assert "Vadodara" in dump
    assert "Customer C1" in dump

    assert len(world.plaintexts) > 60
    leaked = [value for value in world.plaintexts if value in dump]
    assert leaked == []
