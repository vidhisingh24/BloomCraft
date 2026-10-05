import asyncio
import os
from logging.config import fileConfig
from pathlib import Path
from typing import Any

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from app.db.registry import metadata

# backend/.env, located from this file so the working directory never matters.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = metadata
SCHEMA = metadata.schema


def get_url() -> str:
    """Migrator DSN: `-x db=test` selects the test database."""
    target = context.get_x_argument(as_dictionary=True).get("db", "main")
    if target not in ("main", "test"):
        raise RuntimeError(f"unknown -x db={target!r}; expected 'main' or 'test'")
    var = "TEST_DATABASE_MIGRATOR_URL" if target == "test" else "DATABASE_MIGRATOR_URL"
    url = os.environ.get(var)
    if not url:
        raise RuntimeError(f"{var} is not set (expected in backend/.env)")
    return url


def include_name(name: str | None, type_: str, parent_names: Any) -> bool:
    """Compare only schema ``bloomcraft`` (``public`` holds alembic_version and pg_trgm)."""
    if type_ == "schema":
        return name == SCHEMA
    return True


def include_object(
    obj: Any, name: str | None, type_: str, reflected: bool, compare_to: Any
) -> bool:
    """Views are created by hand-written SQL; skip their Table stand-ins."""
    return not (type_ == "table" and getattr(obj, "info", {}).get("is_view"))


def _configure(**kwargs: Any) -> None:
    context.configure(
        target_metadata=target_metadata,
        include_schemas=True,
        include_name=include_name,
        include_object=include_object,
        compare_type=True,
        **kwargs,
    )


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (emit SQL without connecting)."""
    _configure(url=get_url(), literal_binds=True, dialect_opts={"paramstyle": "named"})

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    _configure(connection=connection)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async Engine and associate a connection with the context."""
    connectable = create_async_engine(get_url(), poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
