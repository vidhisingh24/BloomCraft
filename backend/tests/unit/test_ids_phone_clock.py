import uuid
from datetime import UTC, date, datetime

import pytest

from app.core.clock import IST, Clock, get_clock, to_ist
from app.core.ids import CROCKFORD_ALPHABET, is_valid_reference, new_id, new_reference
from app.core.phone import InvalidPhoneError, mask_phone, normalize_indian_mobile


def test_new_id_is_uuid7_and_ordered() -> None:
    first, second = new_id(), new_id()
    assert isinstance(first, uuid.UUID)
    assert first.version == 7
    assert first < second


@pytest.mark.parametrize("prefix", ["BC", "CR"])
def test_new_reference(prefix: str) -> None:
    refs = {new_reference(prefix, 2026) for _ in range(200)}  # type: ignore[arg-type]
    assert len(refs) > 190
    for ref in refs:
        assert ref.startswith(f"{prefix}-2026-")
        assert len(ref) == 14
        assert all(c in CROCKFORD_ALPHABET for c in ref[-6:])
        assert is_valid_reference(ref)
        assert is_valid_reference(ref, prefix)  # type: ignore[arg-type]


def test_new_reference_rejects() -> None:
    with pytest.raises(ValueError):
        new_reference("XX", 2026)  # type: ignore[arg-type]
    with pytest.raises(ValueError):
        new_reference("BC", 26)


@pytest.mark.parametrize(
    "value",
    ["BC-2026-7KQ3M9X", "BC-2026-7KQ3MI", "BC-2026-7kq3m9", "BC-26-7KQ3M9", "XX-2026-7KQ3M9", ""],
)
def test_is_valid_reference_rejects(value: str) -> None:
    assert not is_valid_reference(value)


def test_is_valid_reference_prefix_mismatch() -> None:
    assert is_valid_reference("BC-2026-7KQ3M9", "BC")
    assert not is_valid_reference("BC-2026-7KQ3M9", "CR")


@pytest.mark.parametrize(
    "raw",
    [
        "9876543210",
        "98765 43210",
        "98765-43210",
        "(98765) 43210",
        "+91 98765 43210",
        "+919876543210",
        "(+91) 98765-43210",
        "919876543210",
        "09876543210",
        " 9876543210 ",
    ],
)
def test_normalize_indian_mobile(raw: str) -> None:
    assert normalize_indian_mobile(raw) == "+919876543210"


@pytest.mark.parametrize(
    "raw",
    [
        "5876543210",
        "987654321",
        "98765432101",
        "+1 9876543210",
        "+44 7911 123456",
        "98765x43210",
        "",
        "98+76543210",
        "++919876543210",
        "0091 9876543210",
    ],
)
def test_normalize_indian_mobile_rejects(raw: str) -> None:
    with pytest.raises(InvalidPhoneError):
        normalize_indian_mobile(raw)


def test_mask_phone() -> None:
    assert mask_phone("+919876543210") == "+91 98••••••10"
    with pytest.raises(InvalidPhoneError):
        mask_phone("9876543210")


def test_clock(frozen_clock: datetime) -> None:
    clock = get_clock()
    now = clock.now()
    assert now == frozen_clock
    assert now.tzinfo is UTC
    assert clock.today_ist() == date(2026, 9, 26)
    assert to_ist(now).utcoffset() == IST.utcoffset(now)
    assert to_ist(datetime(2026, 9, 26, 20, 0, tzinfo=UTC)).date() == date(2026, 9, 27)


def test_to_ist_rejects_naive() -> None:
    with pytest.raises(ValueError):
        to_ist(datetime(2026, 1, 1))


def test_clock_is_substitutable() -> None:
    class Fixed(Clock):
        def now(self) -> datetime:
            return datetime(2026, 12, 31, 20, 0, tzinfo=UTC)

    assert Fixed().today_ist() == date(2027, 1, 1)
