"""Platform HTTP behaviour: problem+json errors, limits, headers, CORS, request ids."""

import uuid
from collections.abc import AsyncIterator
from typing import Any

import httpx
import pytest

from tests.conftest import TEST_PREFIX

pytestmark = pytest.mark.db

SECURITY_HEADERS = {
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "cross-origin-resource-policy": "same-site",
    "cross-origin-opener-policy": "same-origin",
}
ALLOWED_ORIGIN = "http://localhost:5173"


def assert_security_headers(response: httpx.Response) -> None:
    for name, value in SECURITY_HEADERS.items():
        assert response.headers.get(name) == value, name
    assert "camera=()" in response.headers["permissions-policy"]
    assert "geolocation=()" in response.headers["permissions-policy"]
    assert "strict-transport-security" not in response.headers  # production only
    assert "server" not in response.headers


def assert_problem(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status
    assert response.headers["content-type"] == "application/problem+json"
    body: dict[str, Any] = response.json()
    assert body["status"] == status
    assert body["code"] == code
    assert body["type"] == "https://api.bloomcraft.in/problems/" + code.lower().replace("_", "-")
    assert body["title"]
    assert body["detail"]
    assert body["requestId"] == response.headers["x-request-id"]
    uuid.UUID(body["requestId"])
    return body


async def test_unknown_route_is_404_problem(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/nope?email=someone@example.com")
    body = assert_problem(response, 404, "NOT_FOUND")
    assert body["instance"] == "/api/v1/nope"  # path only, never the query string
    assert_security_headers(response)
    assert response.headers["cache-control"] == "no-store"


async def test_trailing_slash_is_not_redirected(client: httpx.AsyncClient) -> None:
    response = await client.get("/health/live/")
    assert_problem(response, 404, "NOT_FOUND")


async def test_method_not_allowed_keeps_allow_header(client: httpx.AsyncClient) -> None:
    response = await client.get(f"{TEST_PREFIX}/post-only")
    assert_problem(response, 405, "METHOD_NOT_ALLOWED")
    assert response.headers["allow"] == "POST"


async def test_validation_error_camel_case_fields(client: httpx.AsyncClient) -> None:
    response = await client.post(
        f"{TEST_PREFIX}/echo",
        json={
            "full_name": "Asha",
            "placedAt": "2026-09-26T05:30:00",
            "deliveryAddress": {"cityName": "Vadodara", "post_code": "390001"},
        },
    )
    body = assert_problem(response, 422, "VALIDATION_FAILED")
    errors = {(e["field"], e["code"]) for e in body["errors"]}
    assert ("fullName", "MISSING") in errors
    assert ("full_name", "EXTRA_FORBIDDEN") in errors
    assert ("placedAt", "TIMEZONE_AWARE") in errors
    assert ("deliveryAddress.postCode", "MISSING") in errors
    assert ("deliveryAddress.post_code", "EXTRA_FORBIDDEN") in errors
    assert all(set(e) == {"field", "code", "message"} for e in body["errors"])
    assert "390001" not in response.text  # inputs are never echoed


async def test_invalid_json_body(client: httpx.AsyncClient) -> None:
    response = await client.post(
        f"{TEST_PREFIX}/echo", content=b"{not json", headers={"content-type": "application/json"}
    )
    body = assert_problem(response, 422, "VALIDATION_FAILED")
    assert body["errors"][0]["field"] == ""


async def test_echo_happy_path_camel_case_out(client: httpx.AsyncClient) -> None:
    response = await client.post(
        f"{TEST_PREFIX}/echo",
        json={
            "fullName": "Asha",
            "placedAt": "2026-09-26T11:00:15.5+05:30",
            "deliveryAddress": {"postCode": "390001", "cityName": "Vadodara"},
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "fullName": "Asha",
        "placedAt": "2026-09-26T05:30:15.500Z",
        "postCode": "390001",
    }


async def test_unhandled_exception_is_generic_500(client: httpx.AsyncClient) -> None:
    response = await client.get(f"{TEST_PREFIX}/boom")
    body = assert_problem(response, 500, "INTERNAL")
    assert "kaboom" not in response.text
    assert "Traceback" not in response.text
    assert body["detail"] == "An unexpected error occurred."
    assert_security_headers(response)


async def test_body_over_limit_by_content_length(client: httpx.AsyncClient) -> None:
    payload = b'{"x":"' + b"a" * (1024 * 1024) + b'"}'
    response = await client.post(
        f"{TEST_PREFIX}/echo", content=payload, headers={"content-type": "application/json"}
    )
    assert_problem(response, 413, "PAYLOAD_TOO_LARGE")
    assert_security_headers(response)


async def test_body_over_limit_chunked(client: httpx.AsyncClient) -> None:
    async def chunks() -> AsyncIterator[bytes]:
        yield b'{"x":"'
        for _ in range(20):
            yield b"a" * 64 * 1024
        yield b'"}'

    response = await client.post(
        f"{TEST_PREFIX}/echo", content=chunks(), headers={"content-type": "application/json"}
    )
    assert "content-length" not in response.request.headers
    assert response.request.headers["transfer-encoding"] == "chunked"
    assert_problem(response, 413, "PAYLOAD_TOO_LARGE")


async def test_body_at_limit_is_accepted_by_middleware(client: httpx.AsyncClient) -> None:
    payload = b'{"x":"' + b"a" * (1024 * 1024 - 8) + b'"}'
    assert len(payload) == 1024 * 1024
    response = await client.post(
        f"{TEST_PREFIX}/echo", content=payload, headers={"content-type": "application/json"}
    )
    assert_problem(response, 422, "VALIDATION_FAILED")  # reached the route


@pytest.mark.parametrize("content_type", ["text/plain", "application/x-www-form-urlencoded", None])
async def test_non_json_body_is_415(client: httpx.AsyncClient, content_type: str | None) -> None:
    headers = {"content-type": content_type} if content_type else {}
    response = await client.post(f"{TEST_PREFIX}/echo", content=b"a=b", headers=headers)
    assert_problem(response, 415, "UNSUPPORTED_MEDIA_TYPE")


async def test_json_with_charset_and_bodiless_post_pass(client: httpx.AsyncClient) -> None:
    response = await client.post(
        f"{TEST_PREFIX}/echo",
        content=b"{}",
        headers={"content-type": "application/json; charset=utf-8"},
    )
    assert response.status_code == 422
    response = await client.post(f"{TEST_PREFIX}/post-only")
    assert response.status_code == 200


async def test_security_headers_on_success(client: httpx.AsyncClient) -> None:
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert_security_headers(response)
    assert response.headers["cache-control"] == "no-store"


async def test_docs_get_relaxed_csp_only_on_docs(client: httpx.AsyncClient) -> None:
    docs = await client.get("/docs")
    assert docs.status_code == 200
    assert "cdn.jsdelivr.net" in docs.headers["content-security-policy"]
    schema = await client.get("/openapi.json")
    assert schema.headers["content-security-policy"] == SECURITY_HEADERS["content-security-policy"]


async def test_cors_preflight_allowed_origin(client: httpx.AsyncClient) -> None:
    response = await client.options(
        f"{TEST_PREFIX}/echo",
        headers={
            "origin": ALLOWED_ORIGIN,
            "access-control-request-method": "POST",
            "access-control-request-headers": "content-type, x-csrf-token",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    assert response.headers["access-control-allow-credentials"] == "true"
    assert response.headers["access-control-max-age"] == "600"
    assert "PATCH" in response.headers["access-control-allow-methods"]
    assert_security_headers(response)


async def test_cors_simple_request_allowed_vs_foreign_origin(client: httpx.AsyncClient) -> None:
    allowed = await client.get("/health/live", headers={"origin": ALLOWED_ORIGIN})
    assert allowed.headers["access-control-allow-origin"] == ALLOWED_ORIGIN
    exposed = allowed.headers["access-control-expose-headers"].lower()
    assert "x-request-id" in exposed
    assert "retry-after" in exposed

    foreign = await client.get("/health/live", headers={"origin": "https://evil.example"})
    assert foreign.status_code == 200
    assert not any(h.startswith("access-control-") for h in foreign.headers)

    preflight = await client.options(
        "/health/live",
        headers={"origin": "https://evil.example", "access-control-request-method": "GET"},
    )
    assert "access-control-allow-origin" not in preflight.headers


async def test_request_id_echoed_when_valid_uuid(client: httpx.AsyncClient) -> None:
    inbound = "0199a6b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b"
    response = await client.get("/health/live", headers={"x-request-id": inbound})
    assert response.headers["x-request-id"] == inbound


@pytest.mark.parametrize("junk", ["abc", "'; DROP TABLE x", "1" * 300])
async def test_request_id_replaced_when_junk(client: httpx.AsyncClient, junk: str) -> None:
    response = await client.get("/api/v1/missing", headers={"x-request-id": junk})
    generated = response.headers["x-request-id"]
    assert generated != junk
    assert uuid.UUID(generated).version == 7
    assert response.json()["requestId"] == generated


async def test_access_log_line(
    client: httpx.AsyncClient, captured_logs: list[dict[str, Any]]
) -> None:
    await client.get("/api/v1/missing?token=secret-value")
    await client.get(f"{TEST_PREFIX}/post-only")
    access = [e for e in captured_logs if e["event"] == "request"]
    assert len(access) == 2
    unmatched, matched = access
    assert unmatched["route"] == "unmatched"
    assert unmatched["status"] == 404
    assert unmatched["method"] == "GET"
    assert unmatched["client_ip"] == "203.0.113.0"
    assert isinstance(unmatched["duration_ms"], float)
    assert matched["route"] == f"{TEST_PREFIX}/post-only"
    assert matched["status"] == 405
    assert "secret-value" not in str(access)
