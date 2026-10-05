"""Declarative base, naming convention and column mixins.

Every table lives in schema ``bloomcraft``. Relationships (if any) use ``lazy="raise"``: async
sessions cannot lazy-load.
"""

import uuid
from collections.abc import Sequence
from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    FetchedValue,
    Integer,
    MetaData,
    Uuid,
    event,
    func,
    inspect,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.ids import new_id

SCHEMA = "bloomcraft"

NAMING_CONVENTION: dict[str, str] = {
    "pk": "pk_%(table_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(schema=SCHEMA, naming_convention=NAMING_CONVENTION)

    def __repr__(self) -> str:
        """Class and primary key only — never field values (plaintext or ciphertext)."""
        identity = inspect(self).identity
        return f"<{type(self).__name__} {identity!r}>"


class UUIDPrimaryKey:
    """``id uuid`` — UUIDv7 generated client-side (``new_id``); ``uuidv7()`` as the DB default."""

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=new_id, server_default=text("uuidv7()")
    )


class CreatedAt:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Timestamps(CreatedAt):
    """``updated_at`` is maintained by the ``touch_updated_at`` trigger."""

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        server_onupdate=FetchedValue(),
    )


def version_column() -> Any:
    """Optimistic locking column; pair it with ``__mapper_args__ = {"version_id_col": version}``
    so updates run as ``UPDATE ... WHERE version = :v``."""
    return mapped_column(Integer, nullable=False, server_default=text("1"))


def one_of(column: str, values: Sequence[str], *, name: str | None = None) -> CheckConstraint:
    """``CHECK (column IN (...))`` named ``ck_<table>_<name or column>``; enumerations are text."""
    allowed = ", ".join(f"'{value}'" for value in values)
    return CheckConstraint(f"{column} IN ({allowed})", name=name or column)


class WriteOnlyTableError(RuntimeError):
    pass


def core_insert_only[M: type[Base]](model: M) -> M:
    """Class decorator for write-only tables (outbox, audit log): request actors can't SELECT
    their rows, so they are inserted with Core ``insert()`` and no RETURNING. An ORM insert would
    succeed or fail depending on mapper defaults; refuse it outright."""

    def refuse(mapper: Any, connection: Any, target: Any) -> None:
        raise WriteOnlyTableError(
            f"{model.__tablename__} rows are inserted with Core insert() (no RETURNING), "
            "not through the ORM"
        )

    event.listen(model, "before_insert", refuse)
    return model


def column_values(obj: Base) -> dict[str, Any]:
    """Column values currently set on a transient instance (for Core ``insert()`` of write-only
    tables, which must not use RETURNING). Encrypted descriptors have already filled the
    ciphertext columns."""
    mapper = inspect(type(obj))
    state = inspect(obj)
    values: dict[str, Any] = {}
    for attr in mapper.column_attrs:
        if attr.key in state.dict and state.dict[attr.key] is not None:
            values[attr.columns[0].name] = state.dict[attr.key]
    return values
