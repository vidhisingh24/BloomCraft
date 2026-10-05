"""Application factory."""

from collections.abc import AsyncIterator, Iterable
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from app.api import build_api_router
from app.core import health
from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import install_middleware
from app.crypto import install_crypto
from app.db.session import create_engine, create_sessionmaker

API_TITLE = "BloomCraft API"
API_VERSION = "1.0.0"


def create_app(
    settings: Settings | None = None,
    *,
    extra_routers: Iterable[APIRouter] = (),
) -> FastAPI:
    """Build the app. ``extra_routers`` exists only for tests."""
    settings = settings if settings is not None else get_settings()
    docs = settings.enable_api_docs

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        configure_logging(settings)
        install_crypto(settings)
        for directory in settings.runtime_dirs:
            directory.mkdir(parents=True, exist_ok=True)
        engine = create_engine(settings)
        app.state.engine = engine
        app.state.sessionmaker = create_sessionmaker(engine)
        app.state.migration_heads = health.read_script_heads()
        try:
            yield
        finally:
            await engine.dispose()

    app = FastAPI(
        title=API_TITLE,
        version=API_VERSION,
        openapi_url="/openapi.json" if docs else None,
        docs_url="/docs" if docs else None,
        redoc_url="/redoc" if docs else None,
        redirect_slashes=False,
        lifespan=lifespan,
    )
    app.state.settings = settings

    register_exception_handlers(app)
    install_middleware(app, settings)

    app.include_router(health.router)
    app.include_router(build_api_router(), prefix=settings.api_prefix)
    for router in extra_routers:
        app.include_router(router)
    return app


app = create_app()
