"""Money in integer paise (A7)."""

import re
from collections.abc import Sequence
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

_RUPEES_RE = re.compile(r"^\d+(\.\d{1,2})?$")
_PAISA = Decimal("0.01")


def allocate(total: int, weights: Sequence[int]) -> list[int]:
    """Split ``total`` paise proportionally to ``weights`` by largest remainder.

    The parts always sum to ``total``; ties on the remainder go to the lower index.
    """
    if isinstance(total, bool) or not isinstance(total, int) or total < 0:
        raise ValueError("total must be a non-negative integer")
    if not weights:
        raise ValueError("weights must not be empty")
    if any(isinstance(w, bool) or not isinstance(w, int) or w < 0 for w in weights):
        raise ValueError("weights must be non-negative integers")
    weight_sum = sum(weights)
    if weight_sum == 0:
        raise ValueError("at least one weight must be positive")

    shares = [divmod(total * w, weight_sum) for w in weights]
    parts = [quotient for quotient, _ in shares]
    leftover = total - sum(parts)
    order = sorted(range(len(weights)), key=lambda i: (-shares[i][1], i))
    for i in order[:leftover]:
        parts[i] += 1
    return parts


def percent_of(amount: int, percent: int | Decimal) -> int:
    """``amount * percent / 100`` rounded half-up to the paisa."""
    if isinstance(amount, bool) or not isinstance(amount, int):
        raise TypeError("amount must be an integer number of paise")
    if isinstance(percent, bool) or not isinstance(percent, int | Decimal):
        raise TypeError("percent must be an int or Decimal")
    value = Decimal(amount) * Decimal(percent) / Decimal(100)
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def rupees_to_paise(value: str | Decimal) -> int:
    """``"199.5"`` → ``19950``. At most two decimals; negatives and floats are rejected."""
    if isinstance(value, str):
        text = value.strip()
        if not _RUPEES_RE.fullmatch(text):
            raise ValueError("expected a non-negative rupee amount with at most 2 decimals")
        amount = Decimal(text)
    elif isinstance(value, Decimal):
        if not value.is_finite():
            raise ValueError("amount must be finite")
        amount = value
    else:
        raise TypeError("rupees must be given as str or Decimal, never float")
    if amount < 0:
        raise ValueError("amount must not be negative")
    try:
        if amount != amount.quantize(_PAISA):
            raise ValueError("at most 2 decimal places")
    except InvalidOperation:
        raise ValueError("amount out of range") from None
    return int(amount * 100)
