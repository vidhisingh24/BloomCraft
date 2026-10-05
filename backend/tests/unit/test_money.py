from decimal import Decimal

import pytest
from hypothesis import given
from hypothesis import strategies as st

from app.core.money import allocate, percent_of, rupees_to_paise

weights_strategy = st.lists(
    st.integers(min_value=0, max_value=10_000_000), min_size=1, max_size=12
).filter(lambda ws: sum(ws) > 0)


@given(total=st.integers(min_value=0, max_value=10**12), weights=weights_strategy)
def test_allocate_properties(total: int, weights: list[int]) -> None:
    parts = allocate(total, weights)
    assert sum(parts) == total
    assert len(parts) == len(weights)
    assert all(p >= 0 for p in parts)
    weight_sum = sum(weights)
    for part, weight in zip(parts, weights, strict=True):
        exact = Decimal(total) * weight / weight_sum
        assert abs(Decimal(part) - exact) < 1
        if weight == 0:
            assert part == 0


def test_allocate_examples_and_ties() -> None:
    assert allocate(100, [1, 1, 1]) == [34, 33, 33]  # tie → lower index
    assert allocate(5, [1, 1]) == [3, 2]
    assert allocate(10, [3, 0, 7]) == [3, 0, 7]
    assert allocate(0, [2, 5]) == [0, 0]
    assert allocate(7, [5, 5, 1]) == [3, 3, 1]  # 0.64 beats 0.18


@pytest.mark.parametrize(
    ("total", "weights"),
    [(10, [0, 0]), (10, []), (-1, [1]), (10, [1, -1])],
)
def test_allocate_rejects(total: int, weights: list[int]) -> None:
    with pytest.raises(ValueError):
        allocate(total, weights)


def test_allocate_rejects_bools() -> None:
    with pytest.raises(ValueError):
        allocate(True, [1])  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("amount", "percent", "expected"),
    [
        (1000, 10, 100),
        (999, 10, 100),  # 99.9 → 100
        (995, 10, 100),  # 99.5 → 100 (half up)
        (994, 10, 99),
        (1, 50, 1),  # 0.5 → 1
        (12345, Decimal("12.5"), 1543),  # 1543.125 → 1543
        (0, 15, 0),
    ],
)
def test_percent_of(amount: int, percent: int | Decimal, expected: int) -> None:
    assert percent_of(amount, percent) == expected


def test_percent_of_rejects_float() -> None:
    with pytest.raises(TypeError):
        percent_of(100, 12.5)  # type: ignore[arg-type]
    with pytest.raises(TypeError):
        percent_of(1.0, 10)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("199", 19900),
        ("199.5", 19950),
        ("199.50", 19950),
        (" 0.01 ", 1),
        ("0", 0),
        (Decimal("120.25"), 12025),
        (Decimal("1.500"), 150),
    ],
)
def test_rupees_to_paise(value: str | Decimal, expected: int) -> None:
    assert rupees_to_paise(value) == expected


@pytest.mark.parametrize(
    "value",
    ["-1", "1.234", "1e3", "", "abc", "1,000", Decimal("-5"), Decimal("1.001"), Decimal("NaN")],
)
def test_rupees_to_paise_rejects(value: str | Decimal) -> None:
    with pytest.raises(ValueError):
        rupees_to_paise(value)


def test_rupees_to_paise_rejects_float() -> None:
    with pytest.raises(TypeError):
        rupees_to_paise(1.5)  # type: ignore[arg-type]
