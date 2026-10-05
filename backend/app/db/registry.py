"""Imports every models module so ``metadata`` is complete (Alembic, tests, rotation) and
collects the encrypted-column registry."""

from dataclasses import dataclass

from sqlalchemy import Table

import app.auth.models
import app.core.rate_limit
import app.modules.accounts.models
import app.modules.audit.models
import app.modules.cart.models
import app.modules.catalog.models
import app.modules.checkout.models
import app.modules.custom_requests.models
import app.modules.legacy.models
import app.modules.notifications.models
import app.modules.orders.models
import app.modules.sellers.models
import app.modules.storefront.models
import app.modules.wishlist.models  # noqa: F401
from app.db.base import Base
from app.db.types import FieldKind, iter_encrypted_fields

metadata = Base.metadata


@dataclass(frozen=True, slots=True)
class EncryptedColumn:
    table: str
    column: str
    pk_column: str
    kind: FieldKind
    model: type[Base]
    attribute: str

    @property
    def qualified(self) -> str:
        return f"{self.table}.{self.column}"

    @property
    def sa_table(self) -> Table:
        return metadata.tables[f"{metadata.schema}.{self.table}"]


def _collect() -> tuple[EncryptedColumn, ...]:
    found: list[EncryptedColumn] = []
    for mapper in Base.registry.mappers:
        model = mapper.class_
        for name, field in iter_encrypted_fields(model):
            binding = field.binding(model)
            found.append(
                EncryptedColumn(
                    binding.table, binding.column, binding.pk_column, field.kind, model, name
                )
            )
    return tuple(sorted(found, key=lambda c: (c.table, c.column)))


ENCRYPTED_COLUMNS: tuple[EncryptedColumn, ...] = _collect()
