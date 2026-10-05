"""Pure ASGI middleware (no BaseHTTPMiddleware). Outermost first:

RequestContext → SecurityHeaders → CORS → BodySizeLimit → ContentType → UnhandledError → app

Rejections made here are written as problem+json directly: FastAPI's exception handlers only
run inside the app, not around middleware.
"""

import json
import time
from collections.abc import Mapping
from typing import Final

import structlog
from fastapi import FastAPI
from starlette.datastructures import Headers, MutableHeaders
from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import Settings
from app.core.errors import ERROR_CODES, PROBLEM_MEDIA_TYPE, problem_body
from app.core.request_context import (
    REQUEST_ID_HEADER,
    mask_ip,
    reset_request_context,
    resolve_client_ip,
    resolve_request_id,
    set_request_context,
)

JSON_BODY_LIMIT_BYTES: Final = 1024 * 1024

# path → byte cap for multipart endpoints (they skip the JSON content-type rule). Empty in
# Phase 1; upload endpoints register themselves in later phases.
MULTIPART_ROUTES: dict[str, int] = {}

DOCS_PATHS: Final = frozenset({"/docs", "/docs/oauth2-redirect", "/redoc"})

STRICT_CSP: Final = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
DOCS_CSP: Final = (
    "default-src 'none'; "
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
    "font-src https://fonts.gstatic.com; "
    "img-src 'self' data: https://fastapi.tiangolo.com https://cdn.redoc.ly; "
    "connect-src 'self'; worker-src blob:; "
    "frame-ancestors 'none'; base-uri 'none'"
)
PERMISSIONS_POLICY: Final = ", ".join(
    f"{feature}=()"
    for feature in (
        "accelerometer",
        "autoplay",
        "bluetooth",
        "camera",
        "clipboard-read",
        "clipboard-write",
        "display-capture",
        "encrypted-media",
        "fullscreen",
        "geolocation",
        "gyroscope",
        "hid",
        "idle-detection",
        "magnetometer",
        "microphone",
        "midi",
        "payment",
        "picture-in-picture",
        "publickey-credentials-create",
        "publickey-credentials-get",
        "screen-wake-lock",
        "serial",
        "usb",
        "web-share",
        "xr-spatial-tracking",
    )
)
HSTS: Final = "max-age=63072000; includeSubDomains"

CORS_METHODS: Final = ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
CORS_REQUEST_HEADERS: Final = (
    "Content-Type",
    "X-CSRF-Token",
    "Idempotency-Key",
    "X-Request-ID",
    "If-Match",
)
CORS_EXPOSE_HEADERS: Final = ("X-Request-ID", "Retry-After")

access_log = structlog.get_logger("bloomcraft.access")
error_log = structlog.get_logger("bloomcraft.errors")


async def send_problem(
    send: Send,
    scope: Scope,
    code: str,
    *,
    detail: str | None = None,
    headers: Mapping[str, str] | None = None,
) -> None:
    body = json.dumps(problem_body(code, instance=scope["path"], detail=detail)).encode("utf-8")
    raw_headers = [
        (b"content-type", PROBLEM_MEDIA_TYPE.encode("latin-1")),
        (b"content-length", str(len(body)).encode("latin-1")),
    ]
    raw_headers.extend(
        (k.lower().encode("latin-1"), v.encode("latin-1")) for k, v in (headers or {}).items()
    )
    await send(
        {
            "type": "http.response.start",
            "status": ERROR_CODES[code].status,
            "headers": raw_headers,
        }
    )
    await send({"type": "http.response.body", "body": body})


def _response_headers(message: Message) -> MutableHeaders:
    message["headers"] = list(message.get("headers", ()))
    return MutableHeaders(scope=message)


class RequestContextMiddleware:
    """Request id + client IP context, ``X-Request-ID`` echo, one access-log line."""

    def __init__(self, app: ASGIApp, *, settings: Settings) -> None:
        self.app = app
        self.trusted_proxies = tuple(settings.trusted_proxy_ips)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        headers = Headers(scope=scope)
        request_id = resolve_request_id(headers.get("x-request-id"))
        client = scope.get("client")
        client_ip = resolve_client_ip(
            client[0] if client else None,
            headers.getlist("x-forwarded-for"),
            self.trusted_proxies,
        )
        status = 500
        started = time.perf_counter()

        async def send_with_id(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                _response_headers(message)[REQUEST_ID_HEADER] = request_id
            await send(message)

        tokens = set_request_context(request_id, client_ip)
        try:
            with structlog.contextvars.bound_contextvars(request_id=request_id):
                try:
                    await self.app(scope, receive, send_with_id)
                finally:
                    route = scope.get("route")
                    access_log.info(
                        "request",
                        method=scope["method"],
                        route=getattr(route, "path", None) or "unmatched",
                        status=status,
                        duration_ms=round((time.perf_counter() - started) * 1000, 2),
                        client_ip=mask_ip(client_ip),
                    )
        finally:
            reset_request_context(tokens)


class SecurityHeadersMiddleware:
    """Security headers on every HTTP response (errors and CORS preflights included)."""

    def __init__(self, app: ASGIApp, *, settings: Settings) -> None:
        self.app = app
        self.docs_enabled = settings.enable_api_docs
        self.no_store_prefixes = (settings.api_prefix + "/", "/health/")
        self.no_store_exact = frozenset({settings.api_prefix, "/health"})
        common = {
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
            "Cross-Origin-Resource-Policy": "same-site",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Permissions-Policy": PERMISSIONS_POLICY,
        }
        if settings.is_production:
            common["Strict-Transport-Security"] = HSTS
        self.common = common

    def _headers_for(self, path: str) -> dict[str, str]:
        headers = dict(self.common)
        docs = self.docs_enabled and path in DOCS_PATHS
        headers["Content-Security-Policy"] = DOCS_CSP if docs else STRICT_CSP
        if path in self.no_store_exact or path.startswith(self.no_store_prefixes):
            headers["Cache-Control"] = "no-store"
        return headers

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        extra = self._headers_for(scope["path"])

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = _response_headers(message)
                for name, value in extra.items():
                    headers[name] = value
            await send(message)

        await self.app(scope, receive, send_with_headers)


class StrictCORSMiddleware(CORSMiddleware):
    """Starlette's CORS, except that a non-allowlisted ``Origin`` gets no CORS headers at all
    (Starlette would still add Allow-Credentials / Expose-Headers). Such requests, preflights
    included, go straight to the app."""

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            origin = Headers(scope=scope).get("origin")
            if origin is not None and not self.is_allowed_origin(origin):
                await self.app(scope, receive, send)
                return
        await super().__call__(scope, receive, send)


class _BodyTooLargeError(Exception):
    pass


class BodySizeLimitMiddleware:
    """Caps request bodies (Content-Length and streamed/chunked) → 413 PAYLOAD_TOO_LARGE."""

    def __init__(
        self,
        app: ASGIApp,
        *,
        max_bytes: int = JSON_BODY_LIMIT_BYTES,
        route_limits: Mapping[str, int] = MULTIPART_ROUTES,
    ) -> None:
        self.app = app
        self.max_bytes = max_bytes
        self.route_limits = route_limits

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        limit = self.route_limits.get(scope["path"], self.max_bytes)
        declared = Headers(scope=scope).get("content-length")
        if declared is not None and declared.strip().isdigit() and int(declared) > limit:
            await send_problem(send, scope, "PAYLOAD_TOO_LARGE")
            return

        received = 0
        exceeded = False
        response_started = False
        replaced = False

        async def limited_receive() -> Message:
            nonlocal received, exceeded
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > limit:
                    exceeded = True
                    raise _BodyTooLargeError
            return message

        async def guarded_send(message: Message) -> None:
            nonlocal response_started, replaced
            if message["type"] == "http.response.start":
                response_started = True
                if exceeded:
                    # The app turned the aborted read into some other error; answer 413.
                    replaced = True
                    await send_problem(send, scope, "PAYLOAD_TOO_LARGE")
                    return
            if replaced:
                return
            await send(message)

        try:
            await self.app(scope, limited_receive, guarded_send)
        except _BodyTooLargeError:
            if not response_started:
                await send_problem(send, scope, "PAYLOAD_TOO_LARGE")


class ContentTypeMiddleware:
    """Requests with a body must be ``application/json`` (except multipart routes) → 415."""

    def __init__(self, app: ASGIApp, *, multipart_routes: Mapping[str, int] = MULTIPART_ROUTES):
        self.app = app
        self.multipart_routes = multipart_routes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] in self.multipart_routes:
            await self.app(scope, receive, send)
            return
        headers = Headers(scope=scope)
        length = headers.get("content-length")
        has_body = "transfer-encoding" in headers or (
            length is not None and length.strip() not in ("", "0")
        )
        if has_body:
            media_type = headers.get("content-type", "").split(";", 1)[0].strip().lower()
            if media_type != "application/json":
                await send_problem(
                    send,
                    scope,
                    "UNSUPPORTED_MEDIA_TYPE",
                    detail="Request bodies must be application/json.",
                )
                return
        await self.app(scope, receive, send)


class UnhandledErrorMiddleware:
    """Unhandled exceptions → ``500 INTERNAL`` problem+json. The traceback is logged
    server-side only (without local variables); the client sees a generic detail."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        response_started = False

        async def tracking_send(message: Message) -> None:
            nonlocal response_started
            if message["type"] == "http.response.start":
                response_started = True
            await send(message)

        try:
            await self.app(scope, receive, tracking_send)
        except Exception:
            route = scope.get("route")
            error_log.exception(
                "unhandled_exception",
                method=scope["method"],
                route=getattr(route, "path", None) or "unmatched",
            )
            if response_started:
                raise
            await send_problem(send, scope, "INTERNAL", detail="An unexpected error occurred.")


def install_middleware(app: FastAPI, settings: Settings) -> None:
    # add_middleware prepends: the last one added is the outermost.
    app.add_middleware(UnhandledErrorMiddleware)
    app.add_middleware(ContentTypeMiddleware, multipart_routes=MULTIPART_ROUTES)
    app.add_middleware(
        BodySizeLimitMiddleware, max_bytes=JSON_BODY_LIMIT_BYTES, route_limits=MULTIPART_ROUTES
    )
    app.add_middleware(
        StrictCORSMiddleware,
        allow_origins=[o for o in settings.cors_allowed_origins if o != "*"],
        allow_credentials=True,
        allow_methods=list(CORS_METHODS),
        allow_headers=list(CORS_REQUEST_HEADERS),
        expose_headers=list(CORS_EXPOSE_HEADERS),
        max_age=600,
    )
    app.add_middleware(SecurityHeadersMiddleware, settings=settings)
    app.add_middleware(RequestContextMiddleware, settings=settings)
