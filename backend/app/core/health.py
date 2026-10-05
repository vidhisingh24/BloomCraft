"""Liveness and readiness probes (outside ``/api/v1``, no auth)."""

import asyncio
from pathlib import Path

import structlog
from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.config import BACKEND_DIR, Settings
from app.core.errors import problem_response

READINESS_TIMEOUT_SECONDS = 2.0
ALEMBIC_INI = BACKEND_DIR / "alembic.ini"

log = structlog.get_logger("bloomcraft.health")

router = APIRouter(prefix="/health", tags=["health"])


def read_script_heads(alembic_ini: Path = ALEMBIC_INI) -> frozenset[str]:
    """Head revision(s) of the migration scripts on disk."""
    script = ScriptDirectory.from_config(Config(str(alembic_ini)))
    return frozenset(script.get_heads())


async def database_versions(engine: AsyncEngine) -> frozenset[str]:
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT version_num FROM public.alembic_version"))
        return frozenset(str(row[0]) for row in result)


@router.get("/live", summary="Liveness probe")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get(
    "/ready",
    summary="Readiness probe (database reachable, migrations at head)",
    responses={503: {"description": "Not ready (problem+json, code UNAVAILABLE)"}},
)
async def ready(request: Request) -> JSONResponse:
    settings: Settings = request.app.state.settings
    engine: AsyncEngine = request.app.state.engine
    heads: frozenset[str] = request.app.state.migration_heads
    checks = {"database": "fail", "migrations": "unknown"}
    try:
        async with asyncio.timeout(READINESS_TIMEOUT_SECONDS):
            versions = await database_versions(engine)
        checks["database"] = "ok"
        checks["migrations"] = "ok" if versions == heads else "fail"
    except Exception as exc:
        log.warning("readiness_check_failed", error_type=type(exc).__name__)

    if all(value == "ok" for value in checks.values()):
        body: dict[str, object] = {"status": "ok"}
        if not settings.is_production:
            body["checks"] = checks
        return JSONResponse(body)

    detail = "The service is not ready."
    if not settings.is_production:
        failing = ", ".join(name for name, value in checks.items() if value != "ok")
        detail = f"The service is not ready ({failing})."
    return problem_response("UNAVAILABLE", instance=request.url.path, detail=detail)
