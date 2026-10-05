"""``bloomcraft`` command-line interface. Commands stay thin: the work lives in services.

Every database step: ``transaction`` → ``set_actor(None)`` → ``system_context("<reason>")``,
as the app role. No transaction is held open while waiting for keyboard input.
"""

import asyncio
import contextlib
import difflib
import json
import sys
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path
from typing import Annotated, LiteralString, NoReturn

import aiosmtplib
import typer
from pydantic import SecretStr, ValidationError
from sqlalchemy import select, text, update
from sqlalchemy.engine import make_url
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.bootstrap import (
    AdminRequest,
    BootstrapRefused,
    SellerRequest,
    active_admin_count,
    create_admin,
    create_seller,
    plan_admin,
    plan_seller,
)
from app.auth.password.policy import check_password
from app.core.config import BACKEND_DIR, FieldKeyring, Settings, get_settings
from app.core.health import read_script_heads
from app.core.logging import configure_logging
from app.crypto import install_crypto
from app.crypto.blind_index import normalize_email
from app.crypto.field_encryption import (
    DecryptionError,
    decrypt_text,
    encrypt_text,
    key_id_of,
    reencrypt,
)
from app.crypto.keyring import current_key_material
from app.crypto.passwords import hash_password_async
from app.db.actor import set_actor, system_context
from app.db.errors import sqlstate
from app.db.registry import ENCRYPTED_COLUMNS, EncryptedColumn
from app.db.session import create_engine, create_sessionmaker, transaction
from app.modules.storefront.service import load_store_config
from app.seeds import SeedFileError, SeedKind, apply_seeds, load_seed_files

OPENAPI_PATH = BACKEND_DIR / "docs" / "openapi.json"
CHECK_TIMEOUT_SECONDS = 5.0
KEY_NAMES = ("csrf_secret", "blind_index", "password_pepper", "otp_hmac", "cursor_signing")
PASSWORD_ATTEMPTS = 3

app = typer.Typer(
    name="bloomcraft",
    help="BloomCraft backend tools.",
    no_args_is_help=True,
    pretty_exceptions_show_locals=False,  # locals could hold secrets
)


class DbTarget(StrEnum):
    main = "main"
    test = "test"


@app.callback()
def _startup(
    ctx: typer.Context,
    db: Annotated[
        DbTarget,
        typer.Option("--db", case_sensitive=False, help="Database to act on: main or test."),
    ] = DbTarget.main,
) -> None:
    """Every command starts with redacting logs and the settings' key material installed
    (``doctor`` reports a settings failure itself)."""
    ctx.obj = {"db": db}
    with contextlib.suppress(Exception):
        settings = get_settings()
        # The CLI prints tables; INFO chatter (e.g. system_context reasons) stays out of them.
        level = "WARNING" if settings.log_level == "INFO" else settings.log_level
        configure_logging(settings.model_copy(update={"log_level": level}))
        install_crypto(settings)


def _db_target(ctx: typer.Context) -> DbTarget:
    obj = ctx.find_root().obj or {}
    target = obj.get("db", DbTarget.main)
    return target if isinstance(target, DbTarget) else DbTarget.main


def target_settings(ctx: typer.Context) -> Settings:
    """Settings for the ``--db`` target: ``test`` swaps in the TEST_* database URLs."""
    settings = get_settings()
    if _db_target(ctx) is not DbTarget.test:
        return settings
    if settings.test_database_url is None or settings.test_database_migrator_url is None:
        typer.echo("--db test needs TEST_DATABASE_URL and TEST_DATABASE_MIGRATOR_URL", err=True)
        raise typer.Exit(2)
    return settings.model_copy(
        update={
            "database_url": settings.test_database_url,
            "database_migrator_url": settings.test_database_migrator_url,
        }
    )


def database_name(url: SecretStr | None) -> str:
    """The database a URL points at — never the URL itself."""
    if url is None:
        return "not configured"
    return make_url(url.get_secret_value()).database or "?"


async def in_system_transaction[T](
    settings: Settings, reason: LiteralString, work: Callable[[AsyncSession], Awaitable[T]]
) -> T:
    """One unit of work as the app role under ``system_context(reason)``."""
    engine = create_engine(settings, application_name="bloomcraft-cli")
    try:
        async with transaction(create_sessionmaker(engine)) as session:
            await set_actor(session, None)
            async with system_context(session, reason):
                return await work(session)
    finally:
        await engine.dispose()


def _refuse(message: str) -> NoReturn:
    typer.echo(f"refused: {message}", err=True)
    raise typer.Exit(1)


def _database_error(exc: DBAPIError) -> NoReturn:
    """Exception type and SQLSTATE only: messages and parameters may hold personal data."""
    typer.echo(
        f"database error: {type(exc).__name__} (SQLSTATE {sqlstate(exc) or 'n/a'})", err=True
    )
    raise typer.Exit(1)


class CheckFailedError(Exception):
    """A doctor check failed; the message is safe to print."""


@dataclass(frozen=True, slots=True)
class CheckResult:
    name: str
    ok: bool
    detail: str


# ---- doctor ---------------------------------------------------------------------------------


def _key_checks(settings: Settings) -> list[CheckResult]:
    keys = settings.keys
    results: list[CheckResult] = []
    for name in KEY_NAMES:
        present = getattr(keys, name) is not None
        results.append(CheckResult(f"key {name}", present, "32 bytes" if present else "missing"))
    ring = keys.field_keyring
    detail = f"active={ring.active} ids={','.join(sorted(ring.keys))}" if ring else "missing"
    results.append(CheckResult("field keyring", ring is not None, detail))
    return results


async def _query(url: SecretStr | None, sql: str) -> list[str]:
    if url is None:
        raise CheckFailedError("URL not configured")
    engine = create_async_engine(url.get_secret_value(), hide_parameters=True)
    try:
        async with asyncio.timeout(CHECK_TIMEOUT_SECONDS), engine.connect() as conn:
            rows = await conn.execute(text(sql))
            return [str(row[0]) for row in rows]
    finally:
        await engine.dispose()


async def _connected_as(url: SecretStr | None) -> str:
    (user,) = await _query(url, "SELECT current_user")
    return f"connected as {user}"


async def _at_head(url: SecretStr | None, heads: frozenset[str]) -> str:
    versions = frozenset(await _query(url, "SELECT version_num FROM public.alembic_version"))
    found = ",".join(sorted(versions)) or "none"
    if versions != heads:
        raise CheckFailedError(f"not at head (found {found})")
    return found


async def _smtp_reachable(settings: Settings) -> str:
    client = aiosmtplib.SMTP(
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        use_tls=settings.smtp_security == "tls",
        start_tls=settings.smtp_security == "starttls",
        timeout=CHECK_TIMEOUT_SECONDS,
    )
    await client.connect()
    try:
        response = await client.noop()
    finally:
        await client.quit()
    return f"{settings.smtp_host}:{settings.smtp_port} NOOP {response.code}"


def _dir_writable(directory: Path) -> str:
    directory.mkdir(parents=True, exist_ok=True)
    probe = directory / f".doctor-{uuid.uuid4().hex}"
    probe.write_bytes(b"ok")
    probe.unlink()
    return "writable"


async def _check(name: str, pending: Awaitable[str]) -> CheckResult:
    try:
        return CheckResult(name, True, await pending)
    except CheckFailedError as exc:
        return CheckResult(name, False, str(exc))
    except Exception as exc:
        # Only the type: driver messages may contain connection details.
        return CheckResult(name, False, type(exc).__name__)


async def _actor_context(url: SecretStr) -> str:
    (role,) = await _query(url, "SELECT bloomcraft.actor_role()")
    if role != "none":
        raise CheckFailedError(f"expected 'none' without an actor, got {role!r}")
    return "fail-closed (none)"


def _field_encryption_roundtrip() -> str:
    row_id = uuid.uuid4()
    blob = encrypt_text("doctor", table="doctor", column="probe", row_id=row_id)
    if decrypt_text(blob, table="doctor", column="probe", row_id=row_id) != "doctor":
        raise CheckFailedError("round trip mismatch")
    return f"round trip with key {key_id_of(blob)}"


async def _bootstrap_checks(settings: Settings) -> list[CheckResult]:
    """Admin account and store settings, in one transaction on the ``--db`` target."""

    async def read(session: AsyncSession) -> tuple[int, CheckResult]:
        admins = await active_admin_count(session)
        try:
            loaded = await load_store_config(session)
        except ValidationError:
            return admins, CheckResult(
                "store settings", False, "config fails StoreConfig validation"
            )
        if loaded is None:
            return admins, CheckResult(
                "store settings", False, "missing: run `bloomcraft seed --settings`"
            )
        config, version = loaded
        state = "open" if config.store_open else "closed"
        return admins, CheckResult("store settings", True, f"valid (version {version}, {state})")

    try:
        async with asyncio.timeout(CHECK_TIMEOUT_SECONDS):
            admins, store = await in_system_transaction(settings, "doctor", read)
    except Exception as exc:
        name = type(exc).__name__
        return [
            CheckResult("admin account", False, name),
            CheckResult("store settings", False, name),
        ]
    admin = (
        CheckResult("admin account", True, f"{admins} active")
        if admins
        else CheckResult("admin account", False, "no active admin: run `bloomcraft create-admin`")
    )
    return [admin, store]


async def _async_checks(
    target: Settings, base: Settings, heads: frozenset[str]
) -> list[CheckResult]:
    app_db = database_name(target.database_url)
    return [
        await _check(f"db as app ({app_db})", _connected_as(target.database_url)),
        await _check("db actor context", _actor_context(target.database_url)),
        await _check(
            f"db as migrator ({database_name(target.database_migrator_url)})",
            _connected_as(target.database_migrator_url),
        ),
        await _check(
            f"migrations {database_name(base.database_migrator_url)}",
            _at_head(base.database_migrator_url, heads),
        ),
        await _check(
            f"migrations {database_name(base.test_database_migrator_url)}",
            _at_head(base.test_database_migrator_url, heads),
        ),
        await _check("smtp", _smtp_reachable(target)),
        *await _bootstrap_checks(target),
    ]


def _display_path(path: Path) -> str:
    try:
        return path.relative_to(BACKEND_DIR.parent).as_posix()
    except ValueError:
        return path.as_posix()


def _print_table(results: list[CheckResult]) -> None:
    width = max(len(r.name) for r in results)
    for r in results:
        typer.echo(f"{'PASS' if r.ok else 'FAIL'}  {r.name.ljust(width)}  {r.detail}")


@app.command()
def doctor(ctx: typer.Context) -> None:
    """Check settings, keys, databases, migrations, SMTP, admin, store settings and dirs."""
    try:
        base = get_settings()
        settings = target_settings(ctx)
    except typer.Exit:
        raise
    except Exception as exc:
        typer.echo(f"FAIL  settings  {exc}")
        raise typer.Exit(1) from None

    install_crypto(settings)
    results = [CheckResult("settings", True, f"APP_ENV={settings.app_env}")]
    results.extend(_key_checks(settings))
    try:
        results.append(CheckResult("field encryption", True, _field_encryption_roundtrip()))
    except Exception as exc:
        results.append(CheckResult("field encryption", False, type(exc).__name__))
    results.extend(asyncio.run(_async_checks(settings, base, read_script_heads())))
    for directory in settings.runtime_dirs:
        name = f"dir {_display_path(directory)}"
        try:
            results.append(CheckResult(name, True, _dir_writable(directory)))
        except OSError as exc:
            results.append(CheckResult(name, False, type(exc).__name__))

    _print_table(results)
    if not all(r.ok for r in results):
        raise typer.Exit(1)


# ---- create-admin / create-seller -----------------------------------------------------------


def _read_password(
    settings: Settings,
    *,
    from_stdin: bool,
    email: str,
    full_name: str,
    shop_name: str | None = None,
) -> str:
    """Hidden prompt with confirmation (3 attempts), or one line from stdin. Only the policy
    message is printed; never the password or its length."""
    for _ in range(1 if from_stdin else PASSWORD_ATTEMPTS):
        if from_stdin:
            password = sys.stdin.readline().rstrip("\r\n").lstrip("﻿")
        else:
            password = typer.prompt("Password", hide_input=True, confirmation_prompt=True)
        result = check_password(
            password,
            min_length=settings.password_min_length,
            max_length=settings.password_max_length,
            email=email,
            full_name=full_name,
            extra_words=(shop_name,) if shop_name else (),
        )
        if result.ok:
            return password
        typer.echo(f"password rejected: {result.message}", err=True)
    raise typer.Exit(1)


@app.command("create-admin")
def create_admin_command(
    ctx: typer.Context,
    email: Annotated[str, typer.Option("--email", help="The admin's email address")],
    name: Annotated[str, typer.Option("--name", help="Full name")],
    password_stdin: Annotated[
        bool, typer.Option("--password-stdin", help="Read the password from one stdin line")
    ] = False,
) -> None:
    """Create the first admin. Refused once an active admin exists (use invitations)."""
    settings = target_settings(ctx)
    install_crypto(settings)
    try:
        request = AdminRequest.clean(email=email, name=name, production=settings.is_production)
        plan = asyncio.run(
            in_system_transaction(settings, "create-admin: check", lambda s: plan_admin(s, request))
        )
        password_hash: str | None = None
        if plan.needs_password:
            password = _read_password(
                settings,
                from_stdin=password_stdin,
                email=request.email,
                full_name=request.full_name,
            )
            password_hash = asyncio.run(hash_password_async(password))
            del password
        result = asyncio.run(
            in_system_transaction(
                settings, "create-admin: write", lambda s: create_admin(s, request, password_hash)
            )
        )
    except BootstrapRefused as exc:
        _refuse(str(exc))
    except DBAPIError as exc:
        _database_error(exc)
    if result.created_account:
        typer.echo(f"admin account {result.user_id} created")
    else:
        typer.echo(f"admin grant added to existing account {result.user_id}")
    typer.echo("TOTP enrolment required at first sign-in")


@app.command("create-seller")
def create_seller_command(
    ctx: typer.Context,
    email: Annotated[str, typer.Option("--email", help="The seller's email address")],
    name: Annotated[str, typer.Option("--name", help="Full name")],
    shop_name: Annotated[str, typer.Option("--shop-name", help="Shop name")],
    slug: Annotated[str | None, typer.Option("--slug", help="Shop slug (default: derived)")] = None,
    password_stdin: Annotated[
        bool, typer.Option("--password-stdin", help="Read the password from one stdin line")
    ] = False,
) -> None:
    """Create the founding seller (approved), or add the seller grant to an existing account."""
    settings = target_settings(ctx)
    install_crypto(settings)
    try:
        request = SellerRequest.clean(
            email=email,
            name=name,
            shop_name=shop_name,
            slug=slug,
            production=settings.is_production,
        )
        plan = asyncio.run(
            in_system_transaction(
                settings, "create-seller: check", lambda s: plan_seller(s, request)
            )
        )
        password_hash: str | None = None
        if plan.needs_password:
            password = _read_password(
                settings,
                from_stdin=password_stdin,
                email=request.email,
                full_name=request.full_name,
                shop_name=request.shop_name,
            )
            password_hash = asyncio.run(hash_password_async(password))
            del password
        result = asyncio.run(
            in_system_transaction(
                settings, "create-seller: write", lambda s: create_seller(s, request, password_hash)
            )
        )
    except BootstrapRefused as exc:
        _refuse(str(exc))
    except DBAPIError as exc:
        _database_error(exc)
    if result.created_account:
        typer.echo(f"seller account {result.user_id} created (shop slug {request.slug})")
    else:
        typer.echo(
            f"seller grant added to existing account {result.user_id} (shop slug {request.slug})"
        )
    founding = settings.founding_seller_email
    if founding is None or normalize_email(founding) != request.email:
        typer.echo("note: set FOUNDING_SELLER_EMAIL in backend/.env to this account's email")


# ---- seed -----------------------------------------------------------------------------------


@app.command()
def seed(
    ctx: typer.Context,
    categories: Annotated[
        bool, typer.Option("--categories", help="backend/seeds/catalog.json")
    ] = False,
    settings_: Annotated[
        bool, typer.Option("--settings", help="backend/seeds/store_settings.json")
    ] = False,
    coupons: Annotated[bool, typer.Option("--coupons", help="backend/seeds/coupons.json")] = False,
    all_: Annotated[bool, typer.Option("--all", help="All of the above")] = False,
    update: Annotated[
        bool, typer.Option("--update", help="Make differing rows match the files")
    ] = False,
) -> None:
    """Insert missing seed rows; report (or with --update, overwrite) rows that differ."""
    flags: tuple[tuple[SeedKind, bool], ...] = (
        ("categories", categories),
        ("settings", settings_),
        ("coupons", coupons),
    )
    chosen = [kind for kind, on in flags if on or all_]
    if not chosen:
        typer.echo("choose at least one of --categories, --settings, --coupons or --all", err=True)
        raise typer.Exit(2)
    try:
        loaded = load_seed_files(chosen)
    except SeedFileError as exc:
        typer.echo(f"invalid seed file: {exc}", err=True)
        raise typer.Exit(2) from None
    settings = target_settings(ctx)
    install_crypto(settings)
    try:
        report = asyncio.run(
            in_system_transaction(settings, "seed", lambda s: apply_seeds(s, loaded, update=update))
        )
    except DBAPIError as exc:
        _database_error(exc)

    typer.echo(f"{'kind':<11} created  updated  unchanged  differs")
    for kind, row in report.kinds.items():
        counts = f"{row.created:>7}  {row.updated:>7}  {row.unchanged:>9}  {len(row.differs):>7}"
        typer.echo(f"{kind:<11} {counts}")
    for kind, row in report.kinds.items():
        if row.differs:
            typer.echo(f"{kind} differ: {', '.join(row.differs)} (use --update to overwrite)")
    if report.default_seller_set:
        typer.echo("default custom-request seller set to the only seller")


# ---- openapi --------------------------------------------------------------------------------


def render_openapi() -> str:
    """Deterministic OpenAPI document of the real app (docs enabled, no test routers)."""
    from app.main import create_app  # deferred: importing app.main builds the app

    settings = get_settings().model_copy(update={"enable_api_docs": True})
    schema = create_app(settings).openapi()
    return json.dumps(schema, sort_keys=True, indent=2, ensure_ascii=False) + "\n"


@app.command()
def openapi(
    write: Annotated[bool, typer.Option("--write", help="Write backend/docs/openapi.json")] = False,
    check: Annotated[bool, typer.Option("--check", help="Exit 1 if the snapshot drifted")] = False,
) -> None:
    """Write or check the OpenAPI snapshot (backend/docs/openapi.json)."""
    if write == check:
        typer.echo("Use exactly one of --write or --check.")
        raise typer.Exit(2)
    current = render_openapi()
    if write:
        OPENAPI_PATH.parent.mkdir(parents=True, exist_ok=True)
        OPENAPI_PATH.write_bytes(current.encode("utf-8"))
        typer.echo(f"wrote {OPENAPI_PATH.relative_to(BACKEND_DIR.parent).as_posix()}")
        return
    snapshot = OPENAPI_PATH.read_bytes().decode("utf-8") if OPENAPI_PATH.is_file() else ""
    if snapshot == current:
        typer.echo("openapi.json is up to date")
        return
    diff = difflib.unified_diff(
        snapshot.splitlines(), current.splitlines(), "docs/openapi.json", "generated", lineterm=""
    )
    for line in list(diff)[:60]:
        typer.echo(line)
    typer.echo("openapi.json drifted: run `uv run --project backend bloomcraft openapi --write`")
    raise typer.Exit(1)


# ---- rotate-field-keys ----------------------------------------------------------------------


class RotationError(Exception):
    """Stops the rotation; the message names table.column and key ids only."""


@dataclass
class RotationStats:
    column: str
    scanned: int = 0
    reencrypted: int = 0
    current: int = 0


async def _rotate_column(
    factory: async_sessionmaker[AsyncSession],
    column: EncryptedColumn,
    to_key_id: str,
    keyring: FieldKeyring,
    batch_size: int,
) -> RotationStats:
    """Page through rows by primary key; one transaction per batch, rows locked FOR UPDATE."""
    table = column.sa_table
    pk = table.c[column.pk_column]
    ciphertext = table.c[column.column]
    stats = RotationStats(column.qualified)
    last_pk: object | None = None
    while True:
        async with transaction(factory) as session:
            await set_actor(session, None)
            async with system_context(session, "rotate-field-keys"):
                stmt = (
                    select(pk, ciphertext)
                    .where(ciphertext.is_not(None))
                    .order_by(pk)
                    .limit(batch_size)
                    .with_for_update()
                )
                if last_pk is not None:
                    stmt = stmt.where(pk > last_pk)
                rows = (await session.execute(stmt)).all()
                for row_id, blob in rows:
                    stats.scanned += 1
                    try:
                        key_id = key_id_of(blob)
                    except DecryptionError:
                        raise RotationError(f"{column.qualified}: malformed ciphertext") from None
                    if key_id == to_key_id:
                        stats.current += 1
                        continue
                    if key_id not in keyring.keys:
                        raise RotationError(
                            f"{column.qualified}: key id {key_id!r} is not in the keyring"
                        )
                    try:
                        rotated = reencrypt(
                            blob,
                            table=column.table,
                            column=column.column,
                            row_id=row_id,
                            to_key_id=to_key_id,
                            keyring=keyring,
                        )
                    except DecryptionError:
                        raise RotationError(f"{column.qualified}: cannot decrypt a row") from None
                    await session.execute(
                        update(table).where(pk == row_id).values({column.column: rotated})
                    )
                    stats.reencrypted += 1
        if len(rows) < batch_size:
            return stats
        last_pk = rows[-1][0]


async def _rotate_all(
    settings: Settings, to_key_id: str, keyring: FieldKeyring, batch_size: int
) -> list[RotationStats]:
    engine = create_engine(settings, application_name="bloomcraft-cli")
    try:
        factory = create_sessionmaker(engine)
        return [
            await _rotate_column(factory, column, to_key_id, keyring, batch_size)
            for column in ENCRYPTED_COLUMNS
        ]
    finally:
        await engine.dispose()


@app.command("rotate-field-keys")
def rotate_field_keys(
    ctx: typer.Context,
    to: Annotated[str, typer.Option("--to", help="Target key id (must be the active key)")],
    batch_size: Annotated[int, typer.Option("--batch-size", min=1, max=10_000)] = 500,
) -> None:
    """Re-encrypt every encrypted column with the active field key. Idempotent/restartable."""
    settings = target_settings(ctx)
    install_crypto(settings)
    keyring = current_key_material().field_keyring
    if keyring is None or to not in keyring.keys or keyring.active != to:
        typer.echo(
            f"Key {to!r} must exist in the field keyring and be its active key.\n"
            'Add the new key to backend/secrets/field_keyring.json, set "active" to its id, '
            "keep the old key(s) until this command reports 0 re-encrypted, then run it again."
        )
        raise typer.Exit(2)
    try:
        results = asyncio.run(_rotate_all(settings, to, keyring, batch_size))
    except RotationError as exc:
        typer.echo(f"FAILED  {exc}")
        raise typer.Exit(1) from None

    width = max(len(r.column) for r in results)
    typer.echo(f"{'column'.ljust(width)}  scanned  re-encrypted  already-current")
    for r in results:
        typer.echo(f"{r.column.ljust(width)}  {r.scanned:>7}  {r.reencrypted:>12}  {r.current:>15}")
    typer.echo(
        f"{'TOTAL'.ljust(width)}  {sum(r.scanned for r in results):>7}  "
        f"{sum(r.reencrypted for r in results):>12}  {sum(r.current for r in results):>15}"
    )


if __name__ == "__main__":
    app()
