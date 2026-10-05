"""Database error helpers."""

from sqlalchemy.exc import DBAPIError

IN_FAILED_TRANSACTION = "25P02"
INSUFFICIENT_PRIVILEGE = "42501"


def sqlstate(exc: DBAPIError) -> str | None:
    """The PostgreSQL SQLSTATE of a driver error (asyncpg), if any."""
    orig = exc.orig
    code = getattr(orig, "pgcode", None) or getattr(orig, "sqlstate", None)
    return code or getattr(getattr(orig, "__cause__", None), "sqlstate", None)
