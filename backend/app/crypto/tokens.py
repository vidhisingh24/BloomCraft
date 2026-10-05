"""Opaque tokens, their hashes and short numeric codes."""

import base64
import hashlib
import hmac
import secrets

from app.crypto.keyring import require_key

TOKEN_BYTES = 32


def new_token() -> str:
    """256 random bits, base64url without padding (43 characters)."""
    return base64.urlsafe_b64encode(secrets.token_bytes(TOKEN_BYTES)).rstrip(b"=").decode("ascii")


def hash_token(token: str) -> bytes:
    """SHA-256 of the token (32 bytes); only this is stored."""
    return hashlib.sha256(token.encode("utf-8")).digest()


def tokens_equal(a: bytes | str, b: bytes | str) -> bool:
    """Constant-time comparison."""
    left = a.encode("utf-8") if isinstance(a, str) else a
    right = b.encode("utf-8") if isinstance(b, str) else b
    return hmac.compare_digest(left, right)


def new_numeric_code(digits: int = 6) -> str:
    if not 4 <= digits <= 10:
        raise ValueError("digits must be between 4 and 10")
    return f"{secrets.randbelow(10**digits):0{digits}d}"


def code_hmac(context: str, code: str) -> bytes:
    """HMAC(OTP key, context || 0x00 || code); Phase 5 binds codes to their challenge id."""
    message = context.encode("utf-8") + b"\x00" + code.encode("utf-8")
    return hmac.new(require_key("otp_hmac"), message, hashlib.sha256).digest()
