import base64
import json
import secrets
from datetime import UTC, date, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.core.errors import AppError
from app.core.pagination import Page, PageInfo, decode_cursor, encode_cursor, page_params
from app.core.serialization import IsoDate, RequestModel, ResponseModel, UtcDateTime, format_utc

KEY = secrets.token_bytes(32)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def test_cursor_round_trip() -> None:
    data = {"createdAt": "2026-09-26T05:30:15.123Z", "id": "01a0dd05-1f83-7b95-8674-83a8c6d95fe7"}
    cursor = encode_cursor(data, key=KEY)
    assert "=" not in cursor
    assert decode_cursor(cursor, key=KEY) == data


def _tampered_cursors() -> list[str]:
    cursor = encode_cursor({"id": 1}, key=KEY)
    payload, signature = cursor.split(".")
    other_key = encode_cursor({"id": 1}, key=secrets.token_bytes(32))
    forged_payload = _b64(json.dumps({"id": 2}).encode())
    flipped = signature[:-1] + ("A" if signature[-1] != "A" else "B")
    return [
        f"{forged_payload}.{signature}",
        f"{payload}.{flipped}",
        other_key,
        payload,
        f"{payload}.",
        f".{signature}",
        f"{payload}.{signature}.x",
        "not-a-cursor",
        "",
        "é.é",
        "!!!.???",
        "x" * 2000,
        f"{_b64(b'[1,2]')}.{_b64(b'x' * 32)}",
    ]


@pytest.mark.parametrize("cursor", _tampered_cursors())
def test_cursor_tampered_or_malformed(cursor: str) -> None:
    with pytest.raises(AppError) as exc:
        decode_cursor(cursor, key=KEY)
    assert exc.value.code == "INVALID_CURSOR"
    assert exc.value.status == 400


def test_cursor_non_object_payload_with_valid_signature() -> None:
    import hashlib
    import hmac

    payload = b"[1,2,3]"
    signature = hmac.new(KEY, payload, hashlib.sha256).digest()
    with pytest.raises(AppError):
        decode_cursor(f"{_b64(payload)}.{_b64(signature)}", key=KEY)


def test_page_shape() -> None:
    page = Page[int](items=[1, 2], page=PageInfo(limit=20, next_cursor=None, has_more=False))
    assert page.model_dump(mode="json") == {
        "items": [1, 2],
        "page": {"limit": 20, "nextCursor": None, "hasMore": False},
    }


def test_page_params_defaults() -> None:
    params = page_params()
    assert params.limit == 20
    assert params.cursor is None


class Address(RequestModel):
    post_code: str


class Body(RequestModel):
    full_name: str
    placed_at: UtcDateTime
    address: Address


class Out(ResponseModel):
    full_name: str
    placed_at: UtcDateTime
    due_on: IsoDate


def test_request_model_accepts_camel_case() -> None:
    body = Body.model_validate(
        {
            "fullName": "Asha",
            "placedAt": "2026-09-26T11:00:15.5+05:30",
            "address": {"postCode": "390001"},
        }
    )
    assert body.placed_at == datetime(2026, 9, 26, 5, 30, 15, 500000, tzinfo=UTC)
    assert body.placed_at.tzinfo == UTC
    assert body.address.post_code == "390001"


def test_request_model_rejects_snake_case_and_unknown() -> None:
    with pytest.raises(ValidationError) as exc:
        Body.model_validate(
            {
                "full_name": "Asha",
                "placedAt": "2026-09-26T05:30:00Z",
                "address": {"postCode": "1"},
            }
        )
    types = {(e["type"], e["loc"]) for e in exc.value.errors()}
    assert ("extra_forbidden", ("full_name",)) in types
    assert ("missing", ("fullName",)) in types


def test_request_model_rejects_naive_datetime() -> None:
    with pytest.raises(ValidationError) as exc:
        Body.model_validate(
            {"fullName": "A", "placedAt": "2026-09-26T05:30:00", "address": {"postCode": "1"}}
        )
    assert exc.value.errors()[0]["type"] == "timezone_aware"


def test_response_model_output() -> None:
    out = Out(
        full_name="Asha",
        placed_at=datetime(
            2026, 9, 26, 11, 0, 15, 123999, tzinfo=timezone(timedelta(hours=5, minutes=30))
        ),
        due_on=date(2026, 10, 1),
    )
    assert out.model_dump(mode="json") == {
        "fullName": "Asha",
        "placedAt": "2026-09-26T05:30:15.123Z",
        "dueOn": "2026-10-01",
    }
    assert json.loads(out.model_dump_json()) == out.model_dump(mode="json")


def test_format_utc() -> None:
    assert format_utc(datetime(2026, 1, 2, 3, 4, 5, tzinfo=UTC)) == "2026-01-02T03:04:05.000Z"
    with pytest.raises(ValueError):
        format_utc(datetime(2026, 1, 2))


def test_cursor_rejects_non_canonical_base64() -> None:
    """The last base64url character of a 32-byte signature carries 2 unused bits; changing only
    those must still be rejected."""
    cursor = encode_cursor({"id": 1}, key=KEY)
    payload, signature = cursor.split(".")
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    last = alphabet.index(signature[-1])
    for sibling in {alphabet[(last & ~0b11) | low] for low in range(4)} - {signature[-1]}:
        with pytest.raises(AppError):
            decode_cursor(f"{payload}.{signature[:-1]}{sibling}", key=KEY)
