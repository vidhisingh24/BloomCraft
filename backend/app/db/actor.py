"""Row-level-security actor context — the only code that touches ``bc.actor_*``.

Every transaction starts with ``set_actor`` (``get_db`` does it for requests). The settings are
transaction-local (``set_config(..., true)``): a session-level value would survive into the next
request on a pooled connection. When the transaction ends they vanish, so services never commit
on their own — one transaction per unit of work.

``system_context`` is the audited escape hatch: auth lookups before a session exists, the
worker, CLI commands, the legacy claim and revoking another user's sessions. Every call site
passes its own reason.
"""

import contextlib
import uuid
from collections.abc import AsyncIterator
from typing import LiteralString

import structlog
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.actor import Actor
from app.core.request_context import get_request_id
from app.db.errors import IN_FAILED_TRANSACTION, sqlstate

log = structlog.get_logger("bloomcraft.db.actor")

_SET = text(
    "SELECT set_config('bc.actor_id', :actor_id, true), "
    "set_config('bc.actor_role', :actor_role, true)"
)
_GET = text("SELECT current_setting('bc.actor_id', true), current_setting('bc.actor_role', true)")
_CURRENT = text("SELECT bloomcraft.actor_role(), bloomcraft.actor_id()")


class ActorContextError(RuntimeError):
    pass


def _require_transaction(session: AsyncSession) -> None:
    if not session.in_transaction():
        raise ActorContextError("the actor context can only be set inside a transaction")


async def _apply(session: AsyncSession, actor_id: str, actor_role: str) -> None:
    _require_transaction(session)
    await session.execute(_SET, {"actor_id": actor_id, "actor_role": actor_role})


async def set_actor(session: AsyncSession, actor: Actor | None) -> None:
    """Transaction-local actor; ``None`` clears both settings (fail-closed: zero rows)."""
    if actor is None:
        await _apply(session, "", "")
    else:
        await _apply(session, str(actor.user_id), actor.role)


def _transaction_usable(session: AsyncSession) -> bool:
    transaction = session.sync_session.get_transaction()
    return transaction is not None and transaction.is_active


@contextlib.asynccontextmanager
async def system_context(session: AsyncSession, reason: LiteralString) -> AsyncIterator[None]:
    """Run as role ``system`` (no actor id), then restore the previous actor."""
    _require_transaction(session)
    previous_id, previous_role = (await session.execute(_GET)).one()
    previous_id = previous_id or ""
    previous_role = previous_role or ""
    await _apply(session, "", "system")
    log.info(
        "system_context",
        reason=reason,
        request_id=get_request_id(),
        previous_role=previous_role or "none",
    )
    try:
        yield
    except BaseException:
        with contextlib.suppress(Exception):  # never mask the original error
            await _restore(session, previous_id, previous_role)
        raise
    await _restore(session, previous_id, previous_role)


async def _restore(session: AsyncSession, actor_id: str, actor_role: str) -> None:
    """Restore the saved actor, unless the transaction has already failed: it will roll back,
    taking the transaction-local settings with it."""
    if not _transaction_usable(session):
        return
    try:
        await _apply(session, actor_id, actor_role)
    except DBAPIError as exc:
        if sqlstate(exc) != IN_FAILED_TRANSACTION:
            raise


async def current_db_actor(session: AsyncSession) -> tuple[str, uuid.UUID | None]:
    """``(actor_role(), actor_id())`` as the database sees them."""
    role, actor_id = (await session.execute(_CURRENT)).one()
    return str(role), actor_id
