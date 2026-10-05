"""Indian mobile numbers (A8): 10 digits starting 6-9, stored as E.164 ``+91XXXXXXXXXX``."""

import re

import phonenumbers

_ALLOWED_RE = re.compile(r"^[\d\s\-()+]+$")
_NATIONAL_RE = re.compile(r"^[6-9]\d{9}$")


class InvalidPhoneError(ValueError):
    pass


def normalize_indian_mobile(raw: str) -> str:
    """Tolerates spaces, hyphens, parentheses, ``+91``, ``91`` and a leading ``0``."""
    text = raw.strip()
    if not text or not _ALLOWED_RE.fullmatch(text) or text.count("+") > 1:
        raise InvalidPhoneError("not an Indian mobile number")
    has_plus = "+" in text
    if has_plus and not text.lstrip("( ").startswith("+"):
        raise InvalidPhoneError("not an Indian mobile number")
    digits = re.sub(r"\D", "", text)
    if has_plus:
        if not digits.startswith("91"):
            raise InvalidPhoneError("only Indian (+91) numbers are supported")
        national = digits[2:]
    elif len(digits) == 12 and digits.startswith("91"):
        national = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        national = digits[1:]
    else:
        national = digits
    if not _NATIONAL_RE.fullmatch(national):
        raise InvalidPhoneError("expected 10 digits starting with 6-9")
    parsed = phonenumbers.parse("+91" + national, None)
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def mask_phone(e164: str) -> str:
    """``+919876543210`` → ``+91 98••••••10``."""
    if not re.fullmatch(r"\+91[6-9]\d{9}", e164):
        raise InvalidPhoneError("expected an E.164 Indian mobile number")
    national = e164[3:]
    return f"+91 {national[:2]}{'•' * 6}{national[-2:]}"
