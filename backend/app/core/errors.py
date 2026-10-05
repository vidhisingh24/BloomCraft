"""Error-code registry, ``AppError`` and RFC 9457 problem+json responses."""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, TypedDict

import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.request_context import get_request_id

PROBLEM_MEDIA_TYPE = "application/problem+json"
PROBLEM_TYPE_BASE = "https://api.bloomcraft.in/problems/"

log = structlog.get_logger("bloomcraft.errors")


@dataclass(frozen=True, slots=True)
class ErrorSpec:
    status: int
    title: str


ERROR_CODES: Mapping[str, ErrorSpec] = {
    # 400
    "INVALID_CURSOR": ErrorSpec(400, "Invalid cursor"),
    "INVALID_OR_EXPIRED_CODE": ErrorSpec(400, "Invalid or expired code"),
    "INVALID_TOKEN": ErrorSpec(400, "Invalid token"),
    # 401
    "AUTH_REQUIRED": ErrorSpec(401, "Authentication required"),
    "INVALID_CREDENTIALS": ErrorSpec(401, "Invalid credentials"),
    "SESSION_EXPIRED": ErrorSpec(401, "Session expired"),
    # 403
    "CSRF_FAILED": ErrorSpec(403, "CSRF check failed"),
    "FORBIDDEN": ErrorSpec(403, "Forbidden"),
    "ROLE_NOT_GRANTED": ErrorSpec(403, "Role not granted"),
    "ACCOUNT_UNAVAILABLE": ErrorSpec(403, "Account unavailable"),
    "MFA_REQUIRED": ErrorSpec(403, "Two-step verification required"),
    "STEP_UP_REQUIRED": ErrorSpec(403, "Recent two-step verification required"),
    "VERIFICATION_REQUIRED": ErrorSpec(403, "Verification required"),
    "SELLER_NOT_APPROVED": ErrorSpec(403, "Seller not approved"),
    "ADMIN_INVITE_REQUIRED": ErrorSpec(403, "Admin invitation required"),
    # 404 / 405
    "NOT_FOUND": ErrorSpec(404, "Not found"),
    "METHOD_NOT_ALLOWED": ErrorSpec(405, "Method not allowed"),
    # 409
    "PRICE_CHANGED": ErrorSpec(409, "Price changed"),
    "OUT_OF_STOCK": ErrorSpec(409, "Out of stock"),
    "SELLER_NOT_ACCEPTING_ORDERS": ErrorSpec(409, "Seller not accepting orders"),
    "INVALID_TRANSITION": ErrorSpec(409, "Invalid transition"),
    "VERSION_CONFLICT": ErrorSpec(409, "Version conflict"),
    "IDEMPOTENCY_IN_PROGRESS": ErrorSpec(409, "Request already in progress"),
    "PHONE_IN_USE": ErrorSpec(409, "Phone number in use"),
    "LAST_ADMIN": ErrorSpec(409, "Last admin"),
    # 410
    "PENDING_SIGNUP_EXPIRED": ErrorSpec(410, "Pending sign-up expired"),
    # 413 / 415
    "PAYLOAD_TOO_LARGE": ErrorSpec(413, "Payload too large"),
    "UNSUPPORTED_MEDIA_TYPE": ErrorSpec(415, "Unsupported media type"),
    # 422
    "VALIDATION_FAILED": ErrorSpec(422, "Validation failed"),
    "WEAK_PASSWORD": ErrorSpec(422, "Weak password"),
    "COUPON_INVALID": ErrorSpec(422, "Coupon invalid"),
    "IDEMPOTENCY_KEY_REUSED": ErrorSpec(422, "Idempotency key reused"),
    # 428
    "IDEMPOTENCY_KEY_REQUIRED": ErrorSpec(428, "Idempotency-Key header required"),
    "PRECONDITION_REQUIRED": ErrorSpec(428, "Precondition required"),
    # 429
    "RATE_LIMITED": ErrorSpec(429, "Too many requests"),
    # 500 / 503
    "INTERNAL": ErrorSpec(500, "Internal server error"),
    "UNAVAILABLE": ErrorSpec(503, "Service unavailable"),
}

# Framework HTTPExceptions carry only a status; map it to a registry code.
_STATUS_CODES: Mapping[int, str] = {
    401: "AUTH_REQUIRED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE",
    422: "VALIDATION_FAILED",
    429: "RATE_LIMITED",
    503: "UNAVAILABLE",
}

_VALIDATION_LOC_PREFIXES = frozenset({"body", "query", "path", "header", "cookie"})


class FieldError(TypedDict):
    field: str
    code: str
    message: str


class AppError(Exception):
    """An expected failure rendered as problem+json with a registered ``code``."""

    def __init__(
        self,
        code: str,
        detail: str | None = None,
        *,
        errors: Sequence[FieldError] | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> None:
        if code not in ERROR_CODES:
            raise ValueError(f"unregistered error code {code!r}")
        super().__init__(code)
        self.code = code
        self.status = ERROR_CODES[code].status
        self.detail = detail
        self.errors = list(errors) if errors is not None else None
        self.headers = dict(headers) if headers is not None else None


def problem_type(code: str) -> str:
    return PROBLEM_TYPE_BASE + code.lower().replace("_", "-")


def problem_body(
    code: str,
    *,
    instance: str,
    detail: str | None = None,
    errors: Sequence[FieldError] | None = None,
) -> dict[str, Any]:
    spec = ERROR_CODES[code]
    body: dict[str, Any] = {
        "type": problem_type(code),
        "title": spec.title,
        "status": spec.status,
        "detail": detail if detail is not None else spec.title,
        "instance": instance,
        "code": code,
        "requestId": get_request_id(),
    }
    if errors is not None:
        body["errors"] = list(errors)
    return body


def problem_response(
    code: str,
    *,
    instance: str,
    detail: str | None = None,
    errors: Sequence[FieldError] | None = None,
    headers: Mapping[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        problem_body(code, instance=instance, detail=detail, errors=errors),
        status_code=ERROR_CODES[code].status,
        headers=dict(headers) if headers else None,
        media_type=PROBLEM_MEDIA_TYPE,
    )


def validation_errors(raw: Sequence[Any]) -> list[FieldError]:
    """Pydantic errors → ``[{field, code, message}]`` with camelCase dotted paths.

    Request models validate by alias, so ``loc`` already holds the camelCase names; only the
    ``body``/``query``/... prefix is dropped. Input values are never echoed back.
    """
    result: list[FieldError] = []
    for err in raw:
        loc = list(err.get("loc", ()))
        if loc and loc[0] in _VALIDATION_LOC_PREFIXES:
            loc = loc[1:]
        err_type = str(err.get("type", "invalid"))
        if err_type == "json_invalid":
            loc = []
        result.append(
            FieldError(
                field=".".join(str(part) for part in loc),
                code=err_type.upper(),
                message=str(err.get("msg", "Invalid value")),
            )
        )
    return result


async def _app_error_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, AppError):  # registered for AppError only
        raise exc
    return problem_response(
        exc.code,
        instance=request.url.path,
        detail=exc.detail,
        errors=exc.errors,
        headers=exc.headers,
    )


async def _validation_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        raise exc
    return problem_response(
        "VALIDATION_FAILED",
        instance=request.url.path,
        detail="The request contains invalid fields.",
        errors=validation_errors(exc.errors()),
    )


async def _http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, StarletteHTTPException):
        raise exc
    code = _STATUS_CODES.get(exc.status_code)
    if code is None:
        code = "INTERNAL" if exc.status_code >= 500 else "VALIDATION_FAILED"
    headers = {k: v for k, v in (exc.headers or {}).items() if k.lower() == "allow"}
    return problem_response(code, instance=request.url.path, headers=headers)


def register_exception_handlers(app: FastAPI) -> None:
    """Handlers for expected errors. Unhandled exceptions are turned into ``500 INTERNAL`` by
    ``app.core.middleware.UnhandledErrorMiddleware`` so the response still passes through
    the security-header and request-context middleware."""
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
