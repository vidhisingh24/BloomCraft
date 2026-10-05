"""HMAC-SHA256 blind indexes for exact-match lookups and uniqueness on encrypted values.

digest = HMAC(blind-index key, kind || 0x00 || normalised value). The kind prefix keeps one
string under two kinds apart.
"""

import hashlib
import hmac
import ipaddress
import unicodedata
from typing import Literal, get_args

from app.core.phone import normalize_indian_mobile
from app.crypto.keyring import require_key

BlindIndexKind = Literal["email", "phone", "google_sub", "ip"]
BLIND_INDEX_KINDS: tuple[BlindIndexKind, ...] = get_args(BlindIndexKind)


def normalize_email(value: str) -> str:
    """NFKC, trimmed, lower-cased. This is also the form that is stored."""
    normalized = unicodedata.normalize("NFKC", value).strip().lower()
    if not normalized:
        raise ValueError("empty email")
    return normalized


def normalize(kind: BlindIndexKind, value: str) -> str:
    if kind == "email":
        return normalize_email(value)
    if kind == "phone":
        return normalize_indian_mobile(value)
    if kind == "google_sub":
        if not value:
            raise ValueError("empty subject")
        return value
    if kind == "ip":
        return str(ipaddress.ip_address(value.strip()))
    raise ValueError(f"unknown blind-index kind {kind!r}")


def blind_index(kind: BlindIndexKind, value: str) -> bytes:
    message = kind.encode("ascii") + b"\x00" + normalize(kind, value).encode("utf-8")
    return hmac.new(require_key("blind_index"), message, hashlib.sha256).digest()
