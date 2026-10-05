import base64
import io
import json
import logging
import sys

import pytest
import structlog

from app.core.config import Settings
from app.core.logging import REDACTED, configure_logging, redact_text, redact_value
from app.core.request_context import mask_ip, resolve_client_ip, resolve_request_id

# Obviously fake values, assembled at runtime so secret scanners don't flag this file.
EMAIL = "asha.verma" + "@example.com"
PHONE = "+91 98765 " + "43210"
PASSWORD = "correct-horse-" + "battery-staple"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


COOKIE = "bc_session=" + _b64url(b"foobarbazqux" * 3)
BEARER_TOKEN = _b64url(b"NotARealToken_just_a_test_value1")
JWT = ".".join(_b64url(p) for p in (b'{"alg":"HS256"}', b'{"sub":"1234"}', b"signature-value"))
LONG_B64 = base64.b64encode(bytes(range(1, 33))).decode()  # 44 mixed-case chars
SECRETS = (EMAIL, PHONE, "9876543210", PASSWORD, COOKIE, BEARER_TOKEN, JWT, LONG_B64)


def _render_json(settings: Settings) -> list[dict[str, object]]:
    stream = io.StringIO()
    configure_logging(settings.model_copy(update={"log_format": "json"}), stream=stream)
    log = structlog.get_logger("test.redaction")
    log.info(
        f"signup from {EMAIL} phone {PHONE}",
        password=PASSWORD,
        cookie=COOKIE,
        headers={"Authorization": f"Bearer {BEARER_TOKEN}", "Accept": "application/json"},
        note=f"token {JWT} and key {LONG_B64}",
        contact={"email": EMAIL, "mobile": "9876543210"},
        items=[EMAIL, {"otp_code": "123456"}],
        request_id="01a0dd05-1f83-7b95-8674-83a8c6d95fe7",
    )
    logging.getLogger("uvicorn.error").warning("stdlib says %s / Bearer %s", EMAIL, BEARER_TOKEN)
    lines = [line for line in stream.getvalue().splitlines() if line.strip()]
    return [json.loads(line) for line in lines]


def test_no_secret_appears_in_rendered_logs(test_settings: Settings) -> None:
    events = _render_json(test_settings)
    output = json.dumps(events)
    for secret in SECRETS:
        assert secret not in output, secret
    first, second = events
    assert first["password"] == REDACTED
    assert first["cookie"] == REDACTED
    assert first["headers"] == {"Authorization": REDACTED, "Accept": "application/json"}
    assert first["items"][1] == {"otp_code": REDACTED}  # type: ignore[index]
    assert first["request_id"] == "01a0dd05-1f83-7b95-8674-83a8c6d95fe7"
    assert "a***@example.com" in first["event"]  # type: ignore[operator]
    assert "[PHONE ••10]" in first["event"]  # type: ignore[operator]
    assert second["logger"] == "uvicorn.error"
    assert "Bearer [REDACTED]" in second["event"]  # type: ignore[operator]


def test_console_renderer_redacts(test_settings: Settings) -> None:
    stream = io.StringIO()
    configure_logging(test_settings.model_copy(update={"log_format": "console"}), stream=stream)
    structlog.get_logger("test").info("login", email=EMAIL, authorization=f"Bearer {BEARER_TOKEN}")
    output = stream.getvalue()
    assert "login" in output
    for secret in (EMAIL, BEARER_TOKEN):
        assert secret not in output


def test_exceptions_logged_without_locals(test_settings: Settings) -> None:
    stream = io.StringIO()
    configure_logging(test_settings.model_copy(update={"log_format": "json"}), stream=stream)
    local_secret = PASSWORD  # noqa: F841 - must not be rendered as a local variable
    try:
        raise RuntimeError("boom")
    except RuntimeError:
        structlog.get_logger("test").exception("failed")
    event = json.loads(stream.getvalue().splitlines()[-1])
    assert "Traceback" in event["exception"]
    assert "RuntimeError: boom" in event["exception"]
    assert PASSWORD not in stream.getvalue()


def test_redact_helpers() -> None:
    assert redact_text("mail me at " + EMAIL) == "mail me at a***@example.com"
    assert redact_text("Bearer " + BEARER_TOKEN) == "Bearer [REDACTED]"
    assert redact_text(JWT) == REDACTED
    assert redact_text("call 09876543210") == "call [PHONE ••10]"
    assert redact_text("backend/var/private_media ok") == "backend/var/private_media ok"
    assert (
        redact_text("01a0dd05-1f83-7b95-8674-83a8c6d95fe7")
        == "01a0dd05-1f83-7b95-8674-83a8c6d95fe7"
    )
    assert redact_value(b"raw") == REDACTED
    assert redact_value(("x", {"api_key": "k"})) == ("x", {"api_key": REDACTED})
    assert redact_value({EMAIL}) == {"a***@example.com"}
    assert redact_value(42) == 42


def test_request_id_and_ip_helpers() -> None:
    kept = "0199a6b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b"
    assert resolve_request_id(kept) == kept
    assert resolve_request_id(kept.upper()) == kept
    for junk in (None, "", "abc", "x" * 100, "<script>"):
        generated = resolve_request_id(junk)
        assert generated != junk
        assert len(generated) == 36
    assert mask_ip("203.0.113.77") == "203.0.113.0"
    assert mask_ip("2001:db8:1234:5678::1") == "2001:db8:1234::"
    assert mask_ip(None) is None
    assert mask_ip("nonsense") == "invalid"


def test_client_ip_resolution() -> None:
    from ipaddress import ip_network

    trusted = [ip_network("10.0.0.0/8")]
    # untrusted peer: header ignored
    assert resolve_client_ip("198.51.100.1", ["1.2.3.4"], trusted) == "198.51.100.1"
    # trusted peer: right-most untrusted hop
    assert (
        resolve_client_ip("10.0.0.5", ["1.2.3.4, 198.51.100.9, 10.0.0.2"], trusted)
        == "198.51.100.9"
    )
    # all hops trusted → left-most
    assert resolve_client_ip("10.0.0.5", ["10.0.0.3, 10.0.0.2"], trusted) == "10.0.0.3"
    # malformed hop stops the walk
    assert resolve_client_ip("10.0.0.5", ["garbage, 10.0.0.2"], trusted) == "10.0.0.2"
    # no trusted proxies configured
    assert resolve_client_ip("10.0.0.5", ["1.2.3.4"], []) == "10.0.0.5"
    assert resolve_client_ip(None, [], trusted) is None
    assert resolve_client_ip("not-an-ip", [], trusted) == "not-an-ip"


def test_default_handler_follows_current_stderr(
    test_settings: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    """pytest and CliRunner swap (and close) sys.stderr; the handler must follow the swap."""
    configure_logging(test_settings.model_copy(update={"log_format": "json"}))
    swapped = io.StringIO()
    monkeypatch.setattr(sys, "stderr", swapped)
    structlog.get_logger("test.stderr").warning("contact " + EMAIL)
    output = swapped.getvalue()
    assert "a***@example.com" in output
    assert EMAIL not in output
    handler = logging.getLogger().handlers[0]
    assert handler.stream is swapped
    handler.stream = io.StringIO()  # type: ignore[attr-defined]  # ignored: follows sys.stderr
    assert handler.stream is swapped
