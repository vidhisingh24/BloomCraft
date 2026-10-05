"""Shared fixtures.

Tests run against ``bloomcraft_test``: migrated once per session by the migrator (in a
subprocess, because Alembic's env.py calls ``asyncio.run``; upgrade → downgrade base → upgrade,
before any engine exists), executed as ``bloomcraft_app``. The migrator connection is used only
to truncate between tests, read raw rows and run pg_dump.

Key material: every test runs with keys generated per session in a temp dir (never
``backend/secrets``); a test that installs other keys gets the session keys back afterwards.

Markers: ``db`` tests get every table truncated after each test; ``db_module`` modules build
their data once and truncate at module teardown.
"""

import base64
import json
import secrets
import socketserver
import subprocess
import sys
import threading
from collections.abc import AsyncIterator, Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
import pytest
import structlog
import time_machine
from fastapi import APIRouter, FastAPI
from hypothesis.configuration import set_hypothesis_home_dir
from pydantic import SecretStr
from sqlalchemy import NullPool, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import BACKEND_DIR, Settings
from app.core.serialization import RequestModel, ResponseModel, UtcDateTime
from app.crypto import install_crypto
from app.db.session import DbSession, create_engine, create_sessionmaker
from app.main import create_app

# Hypothesis' example database lives in backend/, wherever pytest is started from.
set_hypothesis_home_dir(BACKEND_DIR / ".hypothesis")

ALEMBIC_INI = BACKEND_DIR / "alembic.ini"
TEST_PREFIX = "/api/v1/_test"
FROZEN_NOW = datetime(2026, 9, 26, 5, 30, 15, 123456, tzinfo=UTC)
UNUSED_DSN = "postgresql+asyncpg://nobody@127.0.0.1:1/unused"
# Cheap argon2 for tests; one test asserts the production defaults.
TEST_ARGON2 = {"argon2_memory_kib": 1024, "argon2_time_cost": 1, "argon2_parallelism": 1}


# ---- keys & settings ------------------------------------------------------------------------


def new_key() -> bytes:
    return secrets.token_bytes(32)


def write_keyring(path: Path, keys: dict[str, bytes], active: str) -> Path:
    encoded = {kid: base64.b64encode(key).decode() for kid, key in keys.items()}
    path.write_text(json.dumps({"active": active, "keys": encoded}), encoding="utf-8")
    return path


def write_key_files(directory: Path) -> dict[str, Path]:
    """Fresh key files; returns Settings kwargs pointing at them."""
    directory.mkdir(parents=True, exist_ok=True)
    files: dict[str, Path] = {}
    for field, name in (
        ("csrf_secret_file", "csrf_secret.key"),
        ("blind_index_key_file", "blind_index.key"),
        ("password_pepper_file", "password_pepper.key"),
        ("otp_hmac_key_file", "otp_hmac.key"),
        ("cursor_signing_key_file", "cursor_signing.key"),
    ):
        path = directory / name
        path.write_text(base64.b64encode(new_key()).decode(), encoding="utf-8")
        files[field] = path
    files["field_encryption_keyring_file"] = write_keyring(
        directory / "field_keyring.json", {"k1": new_key()}, "k1"
    )
    return files


def offline_settings(key_files: dict[str, Path], **overrides: Any) -> Settings:
    """Settings without ``.env`` or a database (unit tests)."""
    values: dict[str, Any] = {"database_url": UNUSED_DSN, **TEST_ARGON2, **key_files}
    values.update(overrides)
    return Settings(_env_file=None, **values)  # type: ignore[call-arg]


@pytest.fixture(scope="session")
def key_files(tmp_path_factory: pytest.TempPathFactory) -> dict[str, Path]:
    return write_key_files(tmp_path_factory.mktemp("keys"))


@pytest.fixture(scope="session")
def crypto_settings(key_files: dict[str, Path]) -> Settings:
    return offline_settings(key_files)


@pytest.fixture(scope="session", autouse=True)
def _session_crypto(crypto_settings: Settings) -> None:
    install_crypto(crypto_settings)


@pytest.fixture(autouse=True)
def _restore_crypto(crypto_settings: Settings) -> Iterator[None]:
    """Tests (and CLI commands) may install other keys; put the session keys back."""
    yield
    install_crypto(crypto_settings)


@pytest.fixture(scope="session")
def env_settings() -> Settings:
    """Settings as loaded from the environment / backend/.env (for the DB URLs only)."""
    return Settings()


def _require(url: SecretStr | None, name: str) -> SecretStr:
    if url is None:
        pytest.skip(f"{name} is not configured")
    return url


@pytest.fixture(scope="session")
def test_settings(env_settings: Settings, key_files: dict[str, Path]) -> Settings:
    app_url = _require(env_settings.test_database_url, "TEST_DATABASE_URL")
    migrator_url = _require(env_settings.test_database_migrator_url, "TEST_DATABASE_MIGRATOR_URL")
    return Settings(
        app_env="test",
        database_url=app_url,
        database_migrator_url=migrator_url,
        test_database_url=app_url,
        test_database_migrator_url=migrator_url,
        enable_api_docs=True,
        log_format="console",
        **TEST_ARGON2,
        **key_files,  # type: ignore[arg-type]
    )


# ---- database -------------------------------------------------------------------------------


def run_alembic(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(  # noqa: S603 - fixed argv, no shell
        [sys.executable, "-m", "alembic", "-c", str(ALEMBIC_INI), "-x", "db=test", *args],
        cwd=BACKEND_DIR,
        capture_output=True,
        text=True,
        check=False,
    )


@pytest.fixture(scope="session")
def migrated_test_db(test_settings: Settings) -> None:
    """upgrade head → downgrade base → upgrade head, before any engine is created (no pooled
    connection may hold prepared statements for dropped objects)."""
    for args in (("upgrade", "head"), ("downgrade", "base"), ("upgrade", "head")):
        result = run_alembic(*args)
        if result.returncode != 0:
            pytest.fail(f"alembic {' '.join(args)} failed:\n{result.stderr[-3000:]}")


@pytest.fixture(scope="session")
async def app_engine(test_settings: Settings, migrated_test_db: None) -> AsyncIterator[AsyncEngine]:
    engine = create_engine(test_settings, application_name="bloomcraft-tests")
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
def app_sessionmaker(app_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return create_sessionmaker(app_engine)


@pytest.fixture(scope="session")
async def migrator_engine(
    test_settings: Settings, migrated_test_db: None
) -> AsyncIterator[AsyncEngine]:
    url = _require(test_settings.test_database_migrator_url, "TEST_DATABASE_MIGRATOR_URL")
    engine = create_async_engine(url.get_secret_value(), poolclass=NullPool)
    yield engine
    await engine.dispose()


async def truncate_bloomcraft_tables(engine: AsyncEngine) -> None:
    """Empty every table in schema ``bloomcraft`` (as the migrator, who owns them)."""
    async with engine.begin() as conn:
        rows = await conn.execute(
            text("SELECT quote_ident(tablename) FROM pg_tables WHERE schemaname = 'bloomcraft'")
        )
        tables = [f"bloomcraft.{row[0]}" for row in rows]
        if tables:
            await conn.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))


@pytest.fixture
async def _truncate_after_test(migrator_engine: AsyncEngine) -> AsyncIterator[None]:
    yield
    await truncate_bloomcraft_tables(migrator_engine)


@pytest.fixture(autouse=True)
def _clean_db(request: pytest.FixtureRequest) -> None:
    """``db`` tests: truncate after each test (not for ``db_module`` modules)."""
    node = request.node
    if node.get_closest_marker("db") is not None and node.get_closest_marker("db_module") is None:
        request.getfixturevalue("_truncate_after_test")


# ---- test-only routes -----------------------------------------------------------------------


class AddressIn(RequestModel):
    post_code: str
    city_name: str


class EchoIn(RequestModel):
    full_name: str
    placed_at: UtcDateTime
    delivery_address: AddressIn


class EchoOut(ResponseModel):
    full_name: str
    placed_at: UtcDateTime
    post_code: str


def build_test_router() -> APIRouter:
    router = APIRouter(prefix=TEST_PREFIX)

    @router.get("/boom")
    async def boom() -> None:
        raise RuntimeError("kaboom: secret detail must not leak")

    @router.post("/echo")
    async def echo(body: EchoIn) -> EchoOut:
        return EchoOut(
            full_name=body.full_name,
            placed_at=body.placed_at,
            post_code=body.delivery_address.post_code,
        )

    @router.post("/post-only")
    async def post_only() -> dict[str, str]:
        return {"status": "ok"}

    @router.post("/uow")
    async def unit_of_work(db: DbSession) -> dict[str, int]:
        value = (await db.execute(text("SELECT 1"))).scalar_one()
        return {"value": int(value)}

    return router


# ---- app & client ---------------------------------------------------------------------------


def make_app(settings: Settings) -> FastAPI:
    return create_app(settings, extra_routers=[build_test_router()])


async def open_client(app: FastAPI) -> AsyncIterator[httpx.AsyncClient]:
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app, client=("203.0.113.7", 50123))
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
            yield c


@pytest.fixture
def app(test_settings: Settings, migrated_test_db: None) -> FastAPI:
    return make_app(test_settings)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[httpx.AsyncClient]:
    async for c in open_client(app):
        yield c


# ---- SMTP stub ------------------------------------------------------------------------------


class _SmtpStubHandler(socketserver.StreamRequestHandler):
    """220 greeting; 250 to EHLO / HELO / NOOP (and anything else); 221 to QUIT."""

    def handle(self) -> None:
        self.wfile.write(b"220 stub ESMTP\r\n")
        for raw in self.rfile:
            command = raw.decode("ascii", "replace").strip().upper()
            if command.startswith("QUIT"):
                self.wfile.write(b"221 bye\r\n")
                return
            self.wfile.write(b"250 ok\r\n")


@pytest.fixture
def smtp_stub() -> Iterator[int]:
    server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), _SmtpStubHandler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_address[1]
    finally:
        server.shutdown()
        server.server_close()


# ---- clock & logs ---------------------------------------------------------------------------


@pytest.fixture
def frozen_clock() -> Iterator[datetime]:
    with time_machine.travel(FROZEN_NOW, tick=False):
        yield FROZEN_NOW


@pytest.fixture
def captured_logs() -> Iterator[list[dict[str, Any]]]:
    with structlog.testing.capture_logs() as logs:
        yield logs
