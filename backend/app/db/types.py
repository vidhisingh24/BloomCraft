"""Encrypted fields as typed descriptors over a private ``bytea`` attribute.

    email_ct: Mapped[bytes | None] = mapped_column("email", LargeBinary)
    email_bidx: Mapped[bytes | None] = mapped_column(LargeBinary)
    email = encrypted_text("email_ct", bidx=("email_bidx", "email"))

- get decrypts; set encrypts with AAD ``table|column|row id`` (the DB column name).
- The row id must exist before encrypting: an empty ``id`` gets ``new_id()``; any other primary
  key (``seller_profiles.user_id``) must already be set.
- ``None`` clears the ciphertext and its blind index. A blind-indexed field stores the
  normalised value and its digest together.
- ``encrypted_json`` holds dicts/lists; reassign to change it (in-place mutation isn't tracked).
- Lookups go through blind indexes only; never filter or sort on ciphertext.
"""

import uuid
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from typing import Any, Literal, Self, overload

from sqlalchemy import Table, inspect
from sqlalchemy.orm import Mapper

from app.core.ids import new_id
from app.crypto.blind_index import BlindIndexKind, blind_index, normalize
from app.crypto.field_encryption import decrypt_json, decrypt_text, encrypt_json, encrypt_text

KindSpec = BlindIndexKind | Callable[[Any], BlindIndexKind]
FieldKind = Literal["text", "json"]


@dataclass(frozen=True, slots=True)
class Binding:
    table: str
    column: str
    pk_key: str
    pk_column: str


class EncryptedField:
    kind: FieldKind

    def __init__(self, ciphertext_attr: str, *, bidx: tuple[str, KindSpec] | None = None) -> None:
        self.ciphertext_attr = ciphertext_attr
        self.bidx = bidx
        self.name = ciphertext_attr
        self._bindings: dict[type, Binding] = {}

    def __set_name__(self, owner: type, name: str) -> None:
        self.name = name

    def binding(self, owner: type) -> Binding:
        cached = self._bindings.get(owner)
        if cached is None:
            mapper: Mapper[Any] = inspect(owner)
            column = mapper.get_property(self.ciphertext_attr).columns[0]
            primary_key = mapper.primary_key
            if len(primary_key) != 1:
                raise TypeError(f"{owner.__name__}: encrypted fields need a single-column key")
            pk_key = mapper.get_property_by_column(primary_key[0]).key
            table = mapper.local_table
            if not isinstance(table, Table):
                raise TypeError(f"{owner.__name__} is not mapped to a table")
            cached = Binding(table.name, column.name, pk_key, primary_key[0].name)
            self._bindings[owner] = cached
        return cached

    def _row_id(self, obj: object, binding: Binding, *, assign: bool) -> uuid.UUID:
        row_id = getattr(obj, binding.pk_key)
        if row_id is None:
            if not assign or binding.pk_key != "id":
                raise ValueError(
                    f"{binding.table}.{binding.pk_column} must be set before {self.name}"
                )
            row_id = new_id()
            setattr(obj, binding.pk_key, row_id)
        if not isinstance(row_id, uuid.UUID):
            raise TypeError(f"{binding.table}.{binding.pk_column} must be a UUID")
        return row_id

    def _encode(self, value: Any, *, table: str, column: str, row_id: uuid.UUID) -> bytes:
        raise NotImplementedError

    def _decode(self, blob: bytes, *, table: str, column: str, row_id: uuid.UUID) -> Any:
        raise NotImplementedError

    def _get(self, obj: object) -> Any:
        blob = getattr(obj, self.ciphertext_attr)
        if blob is None:
            return None
        binding = self.binding(type(obj))
        row_id = self._row_id(obj, binding, assign=False)
        return self._decode(bytes(blob), table=binding.table, column=binding.column, row_id=row_id)

    def __set__(self, obj: object, value: Any) -> None:
        bidx_attr = self.bidx[0] if self.bidx else None
        if value is None:
            setattr(obj, self.ciphertext_attr, None)
            if bidx_attr is not None:
                setattr(obj, bidx_attr, None)
            return
        binding = self.binding(type(obj))
        row_id = self._row_id(obj, binding, assign=True)
        digest: bytes | None = None
        if self.bidx is not None:
            spec = self.bidx[1]
            kind: BlindIndexKind = spec(obj) if callable(spec) else spec
            value = normalize(kind, value)
            digest = blind_index(kind, value)
        blob = self._encode(value, table=binding.table, column=binding.column, row_id=row_id)
        setattr(obj, self.ciphertext_attr, blob)
        if bidx_attr is not None:
            setattr(obj, bidx_attr, digest)


class EncryptedText(EncryptedField):
    kind: FieldKind = "text"

    @overload
    def __get__(self, obj: None, owner: type | None = None) -> Self: ...
    @overload
    def __get__(self, obj: object, owner: type | None = None) -> str | None: ...
    def __get__(self, obj: object | None, owner: type | None = None) -> Self | str | None:
        if obj is None:
            return self
        value: str | None = self._get(obj)
        return value

    def _encode(self, value: Any, *, table: str, column: str, row_id: uuid.UUID) -> bytes:
        if not isinstance(value, str):
            raise TypeError(f"{self.name} must be a string")
        return encrypt_text(value, table=table, column=column, row_id=row_id)

    def _decode(self, blob: bytes, *, table: str, column: str, row_id: uuid.UUID) -> str:
        return decrypt_text(blob, table=table, column=column, row_id=row_id)


class EncryptedJSON(EncryptedField):
    kind: FieldKind = "json"

    @overload
    def __get__(self, obj: None, owner: type | None = None) -> Self: ...
    @overload
    def __get__(self, obj: object, owner: type | None = None) -> Any: ...
    def __get__(self, obj: object | None, owner: type | None = None) -> Any:
        if obj is None:
            return self
        return self._get(obj)

    def _encode(self, value: Any, *, table: str, column: str, row_id: uuid.UUID) -> bytes:
        if self.bidx is not None or not isinstance(value, dict | list):
            raise TypeError(f"{self.name} must be a dict or list")
        return encrypt_json(value, table=table, column=column, row_id=row_id)

    def _decode(self, blob: bytes, *, table: str, column: str, row_id: uuid.UUID) -> Any:
        return decrypt_json(blob, table=table, column=column, row_id=row_id)


def encrypted_text(
    ciphertext_attr: str, *, bidx: tuple[str, KindSpec] | None = None
) -> EncryptedText:
    """Reads return ``str | None``."""
    return EncryptedText(ciphertext_attr, bidx=bidx)


def encrypted_json(ciphertext_attr: str) -> EncryptedJSON:
    return EncryptedJSON(ciphertext_attr)


def iter_encrypted_fields(cls: type) -> Iterator[tuple[str, EncryptedField]]:
    for klass in reversed(cls.__mro__):
        for name, value in vars(klass).items():
            if isinstance(value, EncryptedField):
                yield name, value
