"""Resource ids (UUIDv7) and human references ``BC-YYYY-XXXXXX`` / ``CR-YYYY-XXXXXX`` (A5)."""

import re
import secrets
import uuid
from typing import Literal

CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
REFERENCE_SUFFIX_LENGTH = 6

ReferencePrefix = Literal["BC", "CR"]

_REFERENCE_RE = re.compile(r"^(BC|CR)-(\d{4})-([0-9ABCDEFGHJKMNPQRSTVWXYZ]{6})$")


def new_id() -> uuid.UUID:
    return uuid.uuid7()


def new_reference(prefix: ReferencePrefix, year: int) -> str:
    if prefix not in ("BC", "CR"):
        raise ValueError(f"unknown reference prefix {prefix!r}")
    if not 1000 <= year <= 9999:
        raise ValueError("year must have four digits")
    suffix = "".join(secrets.choice(CROCKFORD_ALPHABET) for _ in range(REFERENCE_SUFFIX_LENGTH))
    return f"{prefix}-{year}-{suffix}"


def is_valid_reference(value: str, prefix: ReferencePrefix | None = None) -> bool:
    match = _REFERENCE_RE.fullmatch(value)
    return match is not None and (prefix is None or match.group(1) == prefix)
