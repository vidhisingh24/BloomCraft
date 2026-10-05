"""structlog configuration with redaction of personal data and secrets.

Every event — structlog or stdlib (uvicorn, SQLAlchemy, ...) — passes through ``redact``
before rendering. Request bodies and query strings are never logged.
"""

import logging
import re
import sys
from collections.abc import Mapping
from typing import Any, TextIO

import structlog
from structlog.typing import EventDict, Processor, WrappedLogger

from app.core.config import Settings

REDACTED = "[REDACTED]"

_SENSITIVE_KEY_PARTS = (
    "password",
    "secret",
    "token",
    "authorization",
    "cookie",
    "csrf",
    "otp",
    "code",
    "api_key",
    "apikey",
    "pepper",
)
# structlog / logging bookkeeping keys that are never redacted by name.
_STRUCTURAL_KEYS = frozenset({"event", "level", "logger", "timestamp", "exception", "exc_info"})

_EMAIL_RE = re.compile(
    r"(?<![\w.+-])([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})"
)
_BEARER_RE = re.compile(r"(?i)\b(bearer|basic)\s+[A-Za-z0-9._~+/=-]+")
_JWT_RE = re.compile(r"\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*")
_PHONE_RE = re.compile(r"(?<![\w+])(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?!\d)")
_LONG_TOKEN_RE = re.compile(r"(?<![A-Za-z0-9+/_=-])[A-Za-z0-9+/_-]{32,}={0,2}(?![A-Za-z0-9+/_=-])")
_UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


def _is_sensitive_key(key: str) -> bool:
    lowered = key.lower().replace("-", "_")
    return lowered not in _STRUCTURAL_KEYS and any(p in lowered for p in _SENSITIVE_KEY_PARTS)


def _mask_long_token(match: re.Match[str]) -> str:
    token = match.group(0)
    if _UUID_RE.fullmatch(token):
        return token
    has_digit = any(c.isdigit() for c in token)
    has_upper = any(c.isupper() for c in token)
    has_lower = any(c.islower() for c in token)
    return REDACTED if has_digit and has_upper and has_lower else token


def _mask_phone(match: re.Match[str]) -> str:
    digits = re.sub(r"\D", "", match.group(0))
    return f"[PHONE ••{digits[-2:]}]"


def redact_text(text: str) -> str:
    if _UUID_RE.fullmatch(text):
        return text
    text = _BEARER_RE.sub(lambda m: f"{m.group(1)} {REDACTED}", text)
    text = _JWT_RE.sub(REDACTED, text)
    text = _EMAIL_RE.sub(lambda m: f"{m.group(1)}***@{m.group(2)}", text)
    text = _LONG_TOKEN_RE.sub(_mask_long_token, text)
    return _PHONE_RE.sub(_mask_phone, text)


def redact_value(value: Any) -> Any:
    if isinstance(value, str):
        return redact_text(value)
    if isinstance(value, Mapping):
        return {
            k: (REDACTED if isinstance(k, str) and _is_sensitive_key(k) else redact_value(v))
            for k, v in value.items()
        }
    if isinstance(value, tuple):
        return tuple(redact_value(v) for v in value)
    if isinstance(value, list):
        return [redact_value(v) for v in value]
    if isinstance(value, set | frozenset):
        return {redact_value(v) for v in value}
    if isinstance(value, bytes | bytearray):
        return REDACTED
    return value


def redact(_logger: WrappedLogger, _method: str, event_dict: EventDict) -> EventDict:
    """structlog processor: sensitive keys → ``[REDACTED]``; PII-looking values masked."""
    for key in list(event_dict):
        value = event_dict[key]
        if key == "exc_info":
            continue
        if _is_sensitive_key(key):
            event_dict[key] = REDACTED
        else:
            event_dict[key] = redact_value(value)
    return event_dict


def _drop_color_message(_logger: WrappedLogger, _method: str, event_dict: EventDict) -> EventDict:
    event_dict.pop("color_message", None)  # uvicorn duplicates the message with ANSI codes
    return event_dict


def _shared_processors() -> list[Processor]:
    return [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.ExtraAdder(),
        _drop_color_message,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
    ]


class _CurrentStderrHandler(logging.StreamHandler[TextIO]):
    """Writes to whatever ``sys.stderr`` is at emit time. pytest and Typer's CliRunner swap (and
    close) ``sys.stderr``; a handler bound to the old object would fail on every later line."""

    @property
    def stream(self) -> TextIO:
        return sys.stderr

    @stream.setter
    def stream(self, value: TextIO) -> None:
        pass  # StreamHandler.__init__ / setStream assign it; always follow sys.stderr instead


def configure_logging(settings: Settings, *, stream: TextIO | None = None) -> None:
    """Route structlog and stdlib logging through one redacting renderer."""
    renderer: Processor
    if settings.log_format == "json":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(
            colors=False, exception_formatter=structlog.dev.plain_traceback
        )

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            *_shared_processors(),
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=False,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=_shared_processors(),
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            # Plain-text traceback (no local variables), then redacted like everything else.
            structlog.processors.format_exc_info,
            redact,
            renderer,
        ],
    )
    handler: logging.Handler = (
        logging.StreamHandler(stream) if stream is not None else _CurrentStderrHandler()
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    for existing in list(root.handlers):
        root.removeHandler(existing)
    root.addHandler(handler)
    root.setLevel(settings.log_level)

    for name in ("uvicorn", "uvicorn.error"):
        uv_logger = logging.getLogger(name)
        uv_logger.handlers.clear()
        uv_logger.propagate = True
    access = logging.getLogger("uvicorn.access")  # would log query strings
    access.handlers.clear()
    access.propagate = False
    access.disabled = True


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    logger: structlog.stdlib.BoundLogger = structlog.stdlib.get_logger(name)
    return logger


__all__ = [
    "REDACTED",
    "configure_logging",
    "get_logger",
    "redact",
    "redact_text",
    "redact_value",
]
