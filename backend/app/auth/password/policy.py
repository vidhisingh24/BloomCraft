"""Password policy (NIST SP 800-63B-4, A25): length in code points after NFC, no composition
rules, and a blocklist check.

The blocklist is zxcvbn: its frequency lists (common and breached passwords, dictionary words,
names) and pattern matchers (repeats, sequences, keyboard walks, dates, l33t), with the
context-specific words NIST asks for (service name, the user's email and name, the shop name)
as ``user_inputs``. At a 15-character minimum a bundled top-N list would be nearly empty.

Pure and synchronous; Phase 5 calls it through ``asyncio.to_thread`` and adds the optional
HIBP check. Messages never contain the password.
"""

import re
import threading
import unicodedata
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Literal

from zxcvbn import zxcvbn

from app.crypto.blind_index import normalize_email

Reason = Literal["too_short", "too_long", "invalid_characters", "too_common"]

MIN_GUESSES_LOG10 = 10.0
ZXCVBN_MAX_LENGTH = 72  # zxcvbn raises above this
SERVICE_WORDS = ("bloomcraft", "bloom craft", "bloom", "craft")
_SEPARATORS = re.compile(r"[\s._@,-]+")
_NAME_PARTS = re.compile(r"[^\w]+|_")
# zxcvbn keeps the user inputs in a module-level dictionary: one scoring at a time.
_ZXCVBN_LOCK = threading.Lock()


@dataclass(frozen=True, slots=True)
class PasswordCheck:
    ok: bool
    reason: Reason | None = None
    message: str | None = None


def _fail(reason: Reason, message: str) -> PasswordCheck:
    return PasswordCheck(ok=False, reason=reason, message=message)


def context_words(
    *, email: str | None, full_name: str | None, extra_words: Iterable[str] = ()
) -> list[str]:
    words: list[str] = list(SERVICE_WORDS)
    if email:
        try:
            address = normalize_email(email)
        except ValueError:
            address = ""
        local, _, domain = address.partition("@")
        words += [address, local, domain.split(".", 1)[0]]
    if full_name:
        name = unicodedata.normalize("NFKC", full_name).casefold().strip()
        words.append(re.sub(r"\s+", "", name))
        words += [part for part in _NAME_PARTS.split(name) if len(part) >= 3]
    for word in extra_words:
        folded = unicodedata.normalize("NFKC", word).casefold().strip()
        words += [folded, re.sub(r"\s+", "", folded)]
    return [word for word in dict.fromkeys(words) if word]


def _guesses_log10(text: str, user_inputs: list[str]) -> float:
    with _ZXCVBN_LOCK:
        result = zxcvbn(text[:ZXCVBN_MAX_LENGTH], user_inputs=user_inputs)
    return float(result["guesses_log10"])


def check_password(
    password: str,
    *,
    min_length: int,
    max_length: int,
    email: str | None = None,
    full_name: str | None = None,
    extra_words: Iterable[str] = (),
) -> PasswordCheck:
    if any(0xD800 <= ord(char) <= 0xDFFF for char in password):  # lone surrogates
        return _fail("invalid_characters", "The password contains characters that can't be used.")
    normalized = unicodedata.normalize("NFC", password)
    if any(unicodedata.category(char) == "Cc" for char in normalized):
        return _fail("invalid_characters", "The password contains characters that can't be used.")
    length = len(normalized)
    if length < min_length:
        return _fail("too_short", f"Use at least {min_length} characters.")
    if length > max_length:
        return _fail("too_long", f"Use at most {max_length} characters.")

    inputs = context_words(email=email, full_name=full_name, extra_words=extra_words)
    folded = unicodedata.normalize("NFKC", normalized)  # full-width spellings are still caught
    guesses = _guesses_log10(folded, inputs)
    # zxcvbn prices separators as random characters; score the joined form too.
    joined = _SEPARATORS.sub("", folded)
    if joined and joined != folded:
        guesses = min(guesses, _guesses_log10(joined, inputs))
    if guesses < MIN_GUESSES_LOG10:
        return _fail(
            "too_common",
            "This password is too easy to guess. Try a longer passphrase of unrelated words.",
        )
    return PasswordCheck(ok=True)
