"""argon2id password hashing with an HMAC pepper.

stored = ``"p1$" + argon2id(HMAC-SHA256(pepper, NFC(password)))`` — the prefix names the
pepper version so the pepper can be rotated later. argon2 never runs on the event loop: async
code uses the ``*_async`` variants (``asyncio.to_thread``).

Passwords are normalised to NFC before hashing (NIST SP 800-63B-4 §3.1.1.2), so composed and
decomposed spellings match. Not NFKC: that would fold distinct passwords together (full-width
letters would become ASCII).
"""

import asyncio
import hashlib
import hmac
import secrets
import unicodedata
from dataclasses import dataclass

from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import get_settings
from app.crypto.keyring import require_key

PEPPER_VERSION = "p1"
_PREFIX = PEPPER_VERSION + "$"


@dataclass(frozen=True, slots=True)
class Argon2Parameters:
    memory_kib: int = 19456
    time_cost: int = 2
    parallelism: int = 1


_parameters: Argon2Parameters | None = None
_hasher: PasswordHasher | None = None
_dummy_hash: str | None = None


def configure_password_hashing(parameters: Argon2Parameters) -> None:
    global _parameters, _hasher, _dummy_hash
    _parameters = parameters
    _hasher = None
    _dummy_hash = None


def current_parameters() -> Argon2Parameters:
    if _parameters is not None:
        return _parameters
    settings = get_settings()
    return Argon2Parameters(
        settings.argon2_memory_kib, settings.argon2_time_cost, settings.argon2_parallelism
    )


def _get_hasher() -> PasswordHasher:
    global _hasher
    if _hasher is None:
        params = current_parameters()
        _hasher = PasswordHasher(
            time_cost=params.time_cost,
            memory_cost=params.memory_kib,
            parallelism=params.parallelism,
            hash_len=32,
            salt_len=16,
            type=Type.ID,
        )
    return _hasher


def normalize_password(password: str) -> str:
    return unicodedata.normalize("NFC", password)


def _prehash(password: str) -> bytes:
    normalized = normalize_password(password).encode("utf-8")
    return hmac.new(require_key("password_pepper"), normalized, hashlib.sha256).digest()


def hash_password(password: str) -> str:
    return _PREFIX + _get_hasher().hash(_prehash(password))


def verify_password(password: str, stored: str | None) -> bool:
    """False on mismatch, unknown prefix or malformed input; never raises on bad input."""
    if not isinstance(password, str) or not isinstance(stored, str):
        return False
    if not stored.startswith(_PREFIX):
        return False
    try:
        return _get_hasher().verify(stored[len(_PREFIX) :], _prehash(password))
    except VerifyMismatchError, VerificationError, InvalidHashError, ValueError:
        return False


def needs_rehash(stored: str) -> bool:
    """True when the parameters changed or the hash uses an older pepper version."""
    if not stored.startswith(_PREFIX):
        return True
    try:
        return _get_hasher().check_needs_rehash(stored[len(_PREFIX) :])
    except InvalidHashError, ValueError:
        return True


def dummy_verify(password: str) -> None:
    """Burn the same work as a real verify (unknown accounts; timing parity)."""
    global _dummy_hash
    if _dummy_hash is None:
        _dummy_hash = hash_password(secrets.token_urlsafe(32))
    verify_password(password, _dummy_hash)


async def hash_password_async(password: str) -> str:
    return await asyncio.to_thread(hash_password, password)


async def verify_password_async(password: str, stored: str | None) -> bool:
    return await asyncio.to_thread(verify_password, password, stored)


async def dummy_verify_async(password: str) -> None:
    await asyncio.to_thread(dummy_verify, password)
