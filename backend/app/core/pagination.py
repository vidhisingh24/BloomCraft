"""Cursor pagination (PLAN A1, A2): ``{items, page: {limit, nextCursor, hasMore}}``.

A cursor is ``base64url(JSON) "." base64url(HMAC-SHA256(JSON))`` signed with
CURSOR_SIGNING_KEY. Anything tampered or malformed → ``400 INVALID_CURSOR``.
"""

import base64
import binascii
import hashlib
import hmac
import json
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Query

from app.core.errors import AppError
from app.core.serialization import ResponseModel
from app.crypto.keyring import require_key

DEFAULT_LIMIT = 20
MAX_LIMIT = 100
MAX_CURSOR_LENGTH = 1024


class PageInfo(ResponseModel):
    limit: int
    next_cursor: str | None
    has_more: bool


class Page[T](ResponseModel):
    items: list[T]
    page: PageInfo


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(text: str) -> bytes:
    padded = text + "=" * (-len(text) % 4)
    data = base64.b64decode(padded, altchars=b"-_", validate=True)
    if _b64encode(data) != text:  # non-canonical: altered unused bits in the last character
        raise ValueError("non-canonical base64url")
    return data


def _signing_key(key: bytes | None) -> bytes:
    return key if key is not None else require_key("cursor_signing")


def encode_cursor(data: Mapping[str, Any], *, key: bytes | None = None) -> str:
    payload = json.dumps(data, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signature = hmac.new(_signing_key(key), payload, hashlib.sha256).digest()
    return f"{_b64encode(payload)}.{_b64encode(signature)}"


def decode_cursor(cursor: str, *, key: bytes | None = None) -> dict[str, Any]:
    signing_key = _signing_key(key)
    invalid = AppError("INVALID_CURSOR", "The pagination cursor is invalid.")
    if not cursor or len(cursor) > MAX_CURSOR_LENGTH or not cursor.isascii():
        raise invalid
    payload_part, sep, signature_part = cursor.partition(".")
    if not sep or not payload_part or not signature_part or "." in signature_part:
        raise invalid
    try:
        payload = _b64decode(payload_part)
        signature = _b64decode(signature_part)
    except binascii.Error, ValueError:
        raise invalid from None
    expected = hmac.new(signing_key, payload, hashlib.sha256).digest()
    if not hmac.compare_digest(signature, expected):
        raise invalid
    try:
        data = json.loads(payload)
    except ValueError:
        raise invalid from None
    if not isinstance(data, dict):
        raise invalid
    return data


@dataclass(frozen=True, slots=True)
class PageParams:
    limit: int
    cursor: str | None


LimitQuery = Annotated[int, Query(ge=1, le=MAX_LIMIT, description="Page size (1-100).")]
CursorQuery = Annotated[str | None, Query(max_length=MAX_CURSOR_LENGTH)]


def page_params(limit: LimitQuery = DEFAULT_LIMIT, cursor: CursorQuery = None) -> PageParams:
    """FastAPI dependency: ``?limit=`` (1-100, default 20) and an opaque ``?cursor=``."""
    return PageParams(limit=limit, cursor=cursor)
