from typing import Any

import pytest

from app.modules.audit.writer import AuditMetadataError, validate_metadata


def test_valid_metadata() -> None:
    metadata = {
        "kinds": ["categories", "coupons"],
        "created": 3,
        "existing_account": False,
        "x": None,
    }
    assert validate_metadata(metadata) == metadata
    assert validate_metadata(None) == {}


@pytest.mark.parametrize(
    "metadata",
    [
        {f"k{i}": i for i in range(21)},
        {"email_hash": "x"},
        {"customerPhone": "x"},
        {"new_password": "x"},
        {"client_secret": "x"},
        {"reset_token": "x"},
        {"otp": "x"},
        {"delivery_address": "x"},
        {"full_name": "x"},
        {"contact": "x"},
        {"note": "x" * 201},
        {"nested": {"a": 1}},
        {"floaty": 1.5},
        {"items": [1, {"a": 1}]},
        {"items": ["x" * 201]},
        {1: "non-string key"},
    ],
)
def test_guard_rejections(metadata: dict[Any, Any]) -> None:
    with pytest.raises(AuditMetadataError):
        validate_metadata(metadata)
