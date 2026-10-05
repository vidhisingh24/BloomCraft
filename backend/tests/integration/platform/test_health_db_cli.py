"""Health probes, unit of work, OpenAPI snapshot, CLI and worker."""

import asyncio
import signal
from pathlib import Path
from typing import Any

import httpx
import pytest
from pydantic import SecretStr
from sqlalchemy.ext.asyncio import AsyncSession
from typer.testing import CliRunner

from app import cli
from app.core.config import Settings
from app.workers import __main__ as worker_main
from app.workers.__main__ import run_worker
from tests.cli_helpers import query
from tests.conftest import TEST_PREFIX, make_app, open_client

pytestmark = pytest.mark.db


async def test_live(client: httpx.AsyncClient) -> None:
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_ready(client: httpx.AsyncClient) -> None:
    response = await client.get("/health/ready")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "checks": {"database": "ok", "migrations": "ok"},
    }


async def test_ready_503_when_database_unreachable(test_settings: Settings) -> None:
    settings = test_settings.model_copy(
        update={
            "database_url": SecretStr(
                "postgresql+asyncpg://bloomcraft_app:x@127.0.0.1:1/bloomcraft_test"
            )
        }
    )
    async for client in open_client(make_app(settings)):
        response = await client.get("/health/ready")
    assert response.status_code == 503
    assert response.headers["content-type"] == "application/problem+json"
    body = response.json()
    assert body["code"] == "UNAVAILABLE"
    assert body["requestId"] == response.headers["x-request-id"]
    assert "database" in body["detail"]


async def test_ready_503_when_migrations_behind(test_settings: Settings) -> None:
    app = make_app(test_settings)
    async for client in open_client(app):
        app.state.migration_heads = frozenset({"ffffffffffff"})
        response = await client.get("/health/ready")
    assert response.status_code == 503
    assert "migrations" in response.json()["detail"]


async def test_ready_hides_checks_in_production(test_settings: Settings) -> None:
    app = make_app(test_settings)
    async for client in open_client(app):
        app.state.settings = test_settings.model_copy(update={"app_env": "production"})
        ok = await client.get("/health/ready")
        app.state.migration_heads = frozenset({"ffffffffffff"})
        failing = await client.get("/health/ready")
    assert ok.json() == {"status": "ok"}
    assert failing.json()["detail"] == "The service is not ready."


async def test_hsts_only_in_production(test_settings: Settings) -> None:
    prod_like = test_settings.model_copy(update={"app_env": "production"})
    async for client in open_client(make_app(prod_like)):
        response = await client.get("/health/live")
    assert response.headers["strict-transport-security"] == "max-age=63072000; includeSubDomains"


async def test_docs_disabled(test_settings: Settings) -> None:
    no_docs = test_settings.model_copy(update={"enable_api_docs": False})
    async for client in open_client(make_app(no_docs)):
        for path in ("/docs", "/redoc", "/openapi.json"):
            assert (await client.get(path)).status_code == 404


async def test_unit_of_work_commits(client: httpx.AsyncClient) -> None:
    response = await client.post(f"{TEST_PREFIX}/uow")
    assert response.status_code == 200
    assert response.json() == {"value": 1}


async def test_failed_commit_is_500_never_200(
    client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    rolled_back: list[bool] = []
    original_rollback = AsyncSession.rollback

    async def failing_commit(self: AsyncSession) -> None:
        raise RuntimeError("commit failed")

    async def tracking_rollback(self: AsyncSession) -> None:
        rolled_back.append(True)
        await original_rollback(self)

    monkeypatch.setattr(AsyncSession, "commit", failing_commit)
    monkeypatch.setattr(AsyncSession, "rollback", tracking_rollback)
    response = await client.post(f"{TEST_PREFIX}/uow")
    assert response.status_code == 500
    assert response.headers["content-type"] == "application/problem+json"
    assert response.json()["code"] == "INTERNAL"
    assert rolled_back == [True]


def test_openapi_snapshot_matches() -> None:
    assert cli.OPENAPI_PATH.read_text(encoding="utf-8") == cli.render_openapi()


def test_openapi_has_no_test_routes() -> None:
    snapshot = cli.OPENAPI_PATH.read_text(encoding="utf-8")
    assert "_test" not in snapshot
    assert "/health/ready" in snapshot


def test_cli_openapi_check() -> None:
    result = CliRunner().invoke(cli.app, ["openapi", "--check"])
    assert result.exit_code == 0, result.output
    assert "up to date" in result.output


def test_cli_openapi_requires_one_flag() -> None:
    assert CliRunner().invoke(cli.app, ["openapi"]).exit_code == 2


def test_cli_openapi_check_detects_drift(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    stale = tmp_path / "openapi.json"
    stale.write_text('{"stale": true}\n', encoding="utf-8")
    monkeypatch.setattr(cli, "OPENAPI_PATH", stale)
    result = CliRunner().invoke(cli.app, ["openapi", "--check"])
    assert result.exit_code == 1
    assert "drifted" in result.output


@pytest.fixture
def hermetic_settings(test_settings: Settings, smtp_stub: int, tmp_path: Path) -> Settings:
    """App and migrator URLs on bloomcraft_test, the session's test keys, runtime dirs under
    tmp_path and SMTP on a local stub: no dependency on .env, backend/secrets or Mailpit."""
    return test_settings.model_copy(
        update={
            "smtp_host": "127.0.0.1",
            "smtp_port": smtp_stub,
            "smtp_security": "none",
            "media_root": tmp_path / "media",
            "media_private_root": tmp_path / "private_media",
            "legacy_import_dir": tmp_path / "imports",
        }
    )


def test_cli_doctor(monkeypatch: pytest.MonkeyPatch, hermetic_settings: Settings) -> None:
    monkeypatch.setattr(cli, "get_settings", lambda: hermetic_settings)
    runner = CliRunner()
    first = runner.invoke(cli.app, ["doctor"])
    assert first.exit_code == 1
    assert "FAIL  admin account" in first.output
    assert "no active admin: run `bloomcraft create-admin`" in first.output
    assert "FAIL  store settings" in first.output
    assert "missing: run `bloomcraft seed --settings`" in first.output

    admin = runner.invoke(
        cli.app,
        ["create-admin", "--email", "owner@example.test", "--name", "Owner", "--password-stdin"],
        input="vadodara tulip garden\n",
    )
    assert admin.exit_code == 0, admin.output
    assert runner.invoke(cli.app, ["seed", "--settings"]).exit_code == 0

    result = runner.invoke(cli.app, ["doctor"])
    assert result.exit_code == 0, result.output
    lines = [line for line in result.output.splitlines() if line.strip()]
    assert lines
    assert all(line.startswith("PASS  ") for line in lines), result.output
    assert "PASS  db as app (bloomcraft_test)" in result.output
    assert "PASS  db as migrator (bloomcraft_test)" in result.output
    assert "PASS  db actor context" in result.output
    assert "PASS  migrations bloomcraft_test" in result.output
    assert "PASS  admin account" in result.output
    assert "1 active" in result.output
    assert "valid (version 1, open)" in result.output
    assert f"127.0.0.1:{hermetic_settings.smtp_port} NOOP 250" in result.output


def test_cli_doctor_reports_failures(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    broken = test_settings.model_copy(update={"database_migrator_url": None, "smtp_port": 1})
    monkeypatch.setattr(cli, "get_settings", lambda: broken)
    result = CliRunner().invoke(cli.app, ["doctor"])
    assert result.exit_code == 1
    assert "FAIL  db as migrator (not configured)" in result.output
    assert "URL not configured" in result.output
    assert "FAIL  smtp" in result.output


def test_cli_doctor_flags_invalid_store_config(
    monkeypatch: pytest.MonkeyPatch, hermetic_settings: Settings
) -> None:
    monkeypatch.setattr(cli, "get_settings", lambda: hermetic_settings)
    assert CliRunner().invoke(cli.app, ["seed", "--settings"]).exit_code == 0
    query(
        hermetic_settings,
        "UPDATE bloomcraft.store_settings SET config = config - 'delivery_methods'",
    )
    result = CliRunner().invoke(cli.app, ["doctor"])
    assert result.exit_code == 1
    assert "FAIL  store settings" in result.output
    assert "config fails StoreConfig validation" in result.output


def test_db_option_selects_test_urls(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    """``--db test`` swaps in the TEST_* URLs; without them it exits 2."""
    main_pointing_elsewhere = test_settings.model_copy(
        update={"database_url": SecretStr("postgresql+asyncpg://x:y@127.0.0.1:1/elsewhere")}
    )
    monkeypatch.setattr(cli, "get_settings", lambda: main_pointing_elsewhere)
    result = CliRunner().invoke(cli.app, ["--db", "TEST", "seed", "--categories"])
    assert result.exit_code == 0, result.output
    no_test = test_settings.model_copy(update={"test_database_url": None})
    monkeypatch.setattr(cli, "get_settings", lambda: no_test)
    refused = CliRunner().invoke(cli.app, ["--db", "test", "seed", "--categories"])
    assert refused.exit_code == 2
    assert "--db test needs TEST_DATABASE_URL" in refused.output


async def test_worker_stops_on_event(captured_logs: list[dict[str, Any]]) -> None:
    stop = asyncio.Event()
    task = asyncio.create_task(run_worker(stop, worker_id="w-test", heartbeat_seconds=0.01))
    await asyncio.sleep(0.05)
    stop.set()
    await asyncio.wait_for(task, timeout=1)
    events = [e["event"] for e in captured_logs]
    assert events[0] == "worker_started"
    assert "worker_heartbeat" in events
    assert events[-1] == "worker_stopped"


async def test_worker_main_stops_on_sigint_handler(captured_logs: list[dict[str, Any]]) -> None:
    previous = signal.getsignal(signal.SIGINT)
    task = asyncio.create_task(worker_main._main("w-signal"))
    await asyncio.sleep(0.05)
    handler = signal.getsignal(signal.SIGINT)
    assert callable(handler)
    assert handler is not previous
    handler(signal.SIGINT, None)  # what Ctrl+C would invoke
    await asyncio.wait_for(task, timeout=1)
    assert signal.getsignal(signal.SIGINT) is previous  # restored
    events = [e["event"] for e in captured_logs]
    assert events == ["worker_started", "worker_signal", "worker_stopped"]


def test_worker_shutdown_signals_include_sigint() -> None:
    assert signal.SIGINT in worker_main._shutdown_signals()
