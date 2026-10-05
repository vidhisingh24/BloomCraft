"""``bloomcraft rotate-field-keys`` end to end. CliRunner tests are plain ``def`` tests because
the CLI calls ``asyncio.run``; checks after the command run in their own event loop."""

import asyncio
import base64
import json
import re
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy import NullPool, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from typer.testing import CliRunner

from app import cli
from app.core.config import Settings
from app.crypto import install_crypto
from app.crypto.field_encryption import key_id_of
from app.db.actor import set_actor, system_context
from app.db.registry import ENCRYPTED_COLUMNS
from app.db.session import create_engine, create_sessionmaker, transaction
from tests.conftest import TEST_ARGON2, new_key, write_keyring
from tests.factories import World, build_world

pytestmark = pytest.mark.db


@pytest.fixture
async def world(app_sessionmaker: async_sessionmaker[AsyncSession]) -> AsyncIterator[World]:
    """Fixture rows written under the session keyring (k1)."""
    async with transaction(app_sessionmaker) as session:
        await set_actor(session, None)
        async with system_context(session, "tests: rotation fixture"):
            built = await build_world(session)
    yield built


def settings_with_keyring(
    base: Settings, tmp_path: Path, keys: dict[str, bytes], active: str
) -> Settings:
    path = write_keyring(tmp_path / f"keyring-{'-'.join(sorted(keys))}.json", keys, active)
    values: dict[str, Any] = {
        "app_env": "test",
        "database_url": base.database_url,
        "test_database_migrator_url": base.test_database_migrator_url,
        "csrf_secret_file": base.csrf_secret_file,
        "blind_index_key_file": base.blind_index_key_file,
        "password_pepper_file": base.password_pepper_file,
        "otp_hmac_key_file": base.otp_hmac_key_file,
        "cursor_signing_key_file": base.cursor_signing_key_file,
        "field_encryption_keyring_file": path,
        **TEST_ARGON2,
    }
    return Settings(_env_file=None, **values)  # type: ignore[call-arg]


def session_k1(settings: Settings) -> bytes:
    doc = json.loads(settings.field_encryption_keyring_file.read_text(encoding="utf-8"))
    return base64.b64decode(doc["keys"]["k1"])


def rotate(monkeypatch: pytest.MonkeyPatch, settings: Settings, *args: str) -> Any:
    monkeypatch.setattr(cli, "get_settings", lambda: settings)
    return CliRunner().invoke(cli.app, ["rotate-field-keys", *args])


def totals(output: str) -> tuple[int, int, int]:
    match = re.search(r"^TOTAL\s+(\d+)\s+(\d+)\s+(\d+)$", output, re.MULTILINE)
    assert match, output
    scanned, reencrypted, current = (int(g) for g in match.groups())
    return scanned, reencrypted, current


async def key_ids_by_column(settings: Settings) -> dict[str, set[str]]:
    """Raw blobs through the migrator (who bypasses RLS)."""
    assert settings.test_database_migrator_url is not None
    engine = create_async_engine(
        settings.test_database_migrator_url.get_secret_value(), poolclass=NullPool
    )
    try:
        found: dict[str, set[str]] = {}
        async with engine.connect() as conn:
            for column in ENCRYPTED_COLUMNS:
                ciphertext = column.sa_table.c[column.column]
                blobs = (
                    await conn.execute(select(ciphertext).where(ciphertext.is_not(None)))
                ).scalars()
                found[column.qualified] = {key_id_of(blob) for blob in blobs}
        return found
    finally:
        await engine.dispose()


async def read_everything(settings: Settings) -> int:
    """Decrypt every encrypted attribute of every row, as the app role under system."""
    install_crypto(settings)
    engine = create_engine(settings, application_name="bloomcraft-tests-rotation")
    decrypted = 0
    try:
        async with transaction(create_sessionmaker(engine)) as session:
            await set_actor(session, None)
            async with system_context(session, "tests: read after rotation"):
                for column in ENCRYPTED_COLUMNS:
                    for row in (await session.execute(select(column.model))).scalars():
                        getattr(row, column.attribute)
                        decrypted += 1
    finally:
        await engine.dispose()
    return decrypted


def test_rotate_to_k2(
    world: World, test_settings: Settings, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    k1, k2 = session_k1(test_settings), new_key()
    both = settings_with_keyring(test_settings, tmp_path, {"k1": k1, "k2": k2}, "k2")
    before = asyncio.run(key_ids_by_column(test_settings))
    assert set().union(*before.values()) == {"k1"}

    result = rotate(monkeypatch, both, "--to", "k2", "--batch-size", "2")
    assert result.exit_code == 0, result.output
    scanned, reencrypted, current = totals(result.output)
    assert scanned == reencrypted > 0
    assert current == 0
    assert "users.email" in result.output
    for plaintext in world.plaintexts:
        assert plaintext not in result.output

    after = asyncio.run(key_ids_by_column(test_settings))
    assert set().union(*after.values()) == {"k2"}
    assert {k for k, v in after.items() if v} == {k for k, v in before.items() if v}

    only_k2 = settings_with_keyring(test_settings, tmp_path, {"k2": k2}, "k2")
    assert asyncio.run(read_everything(only_k2)) >= scanned

    again = rotate(monkeypatch, both, "--to", "k2")
    assert again.exit_code == 0, again.output
    assert totals(again.output) == (scanned, 0, scanned)


def test_target_must_be_the_active_key(
    world: World, test_settings: Settings, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    both = settings_with_keyring(
        test_settings, tmp_path, {"k1": session_k1(test_settings), "k2": new_key()}, "k2"
    )
    for target in ("k1", "k9"):
        result = rotate(monkeypatch, both, "--to", target)
        assert result.exit_code == 2
        assert "must exist in the field keyring and be its active key" in result.output


def test_unknown_key_in_data_stops_rotation(
    world: World, test_settings: Settings, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    other = settings_with_keyring(test_settings, tmp_path, {"k3": new_key()}, "k3")
    result = rotate(monkeypatch, other, "--to", "k3")
    assert result.exit_code == 1
    assert re.search(r"FAILED  \w+\.\w+: key id 'k1' is not in the keyring", result.output)
