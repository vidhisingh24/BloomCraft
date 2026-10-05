"""Application settings.

Values come from the process environment and ``backend/.env`` (optional). Every relative
path value (``backend/secrets/...``) resolves against the repository root, so the working
directory never matters. ``*_FILE`` secrets are read at startup; secret values never appear
in reprs, errors or logs (key ids only).
"""

import base64
import binascii
import json
import re
from collections.abc import Mapping
from dataclasses import dataclass, field
from functools import lru_cache
from ipaddress import IPv4Network, IPv6Network, ip_network
from pathlib import Path
from typing import Annotated, Literal, Self
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    EmailStr,
    Field,
    NonNegativeInt,
    PositiveInt,
    PrivateAttr,
    SecretBytes,
    SecretStr,
    model_validator,
)
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent
KEY_BYTES = 32
KEY_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,32}$")

KeyName = Literal["csrf_secret", "blind_index", "password_pepper", "otp_hmac", "cursor_signing"]


class ConfigError(RuntimeError):
    """A required setting or key is unavailable at runtime."""


# ---- field types ---------------------------------------------------------------------------


def _resolve_repo_path(value: Path) -> Path:
    return value if value.is_absolute() else REPO_ROOT / value


def _split_csv(value: object) -> object:
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return value


def _parse_networks(value: object) -> object:
    items = _split_csv(value)
    if isinstance(items, list):
        networks: list[IPv4Network | IPv6Network] = []
        for item in items:
            if isinstance(item, IPv4Network | IPv6Network):
                networks.append(item)
                continue
            try:
                networks.append(ip_network(str(item), strict=False))
            except ValueError:
                raise ValueError(f"{item!r} is not an IP address or CIDR network") from None
        return networks
    return value


def _http_url(value: str) -> str:
    parts = urlsplit(value)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise ValueError("must be an absolute http(s) URL")
    return value.rstrip("/")


def _origin(value: str) -> str:
    if value == "*":
        return value  # reported by the configuration check with the other violations
    parts = urlsplit(value)
    if (
        parts.scheme not in ("http", "https")
        or not parts.hostname
        or parts.path not in ("", "/")
        or parts.query
        or parts.fragment
    ):
        raise ValueError(f"{value!r} is not an origin (scheme://host[:port])")
    return value.rstrip("/")


def _timezone(value: str) -> str:
    try:
        ZoneInfo(value)
    except ZoneInfoNotFoundError, ValueError:
        raise ValueError(f"unknown time zone {value!r}") from None
    return value


def _api_prefix(value: str) -> str:
    if not value.startswith("/") or value.endswith("/"):
        raise ValueError("must start with '/' and not end with '/'")
    return value


class RateLimit(BaseModel):
    """``count`` requests per ``window_seconds``."""

    model_config = ConfigDict(frozen=True)

    count: PositiveInt
    window_seconds: PositiveInt

    def __str__(self) -> str:
        return f"{self.count}/{self.window_seconds}"


def _parse_rate_limit(value: object) -> object:
    if isinstance(value, str):
        count, sep, window = value.strip().partition("/")
        if not sep:
            raise ValueError("expected 'count/window_seconds'")
        return {"count": count.strip(), "window_seconds": window.strip()}
    return value


RepoPath = Annotated[Path, AfterValidator(_resolve_repo_path)]
HttpUrlStr = Annotated[str, AfterValidator(_http_url)]
OriginList = Annotated[
    list[Annotated[str, AfterValidator(_origin)]], NoDecode, BeforeValidator(_split_csv)
]
NetworkList = Annotated[list[IPv4Network | IPv6Network], NoDecode, BeforeValidator(_parse_networks)]
RateLimitSpec = Annotated[RateLimit, NoDecode, BeforeValidator(_parse_rate_limit)]


# ---- loaded secrets -------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class FieldKeyring:
    """Versioned AES-256-GCM keys; the repr shows key ids only."""

    active: str
    keys: Mapping[str, SecretBytes] = field(repr=False)

    def __repr__(self) -> str:
        return f"FieldKeyring(active={self.active!r}, key_ids={sorted(self.keys)!r})"


@dataclass(frozen=True, slots=True)
class KeyMaterial:
    csrf_secret: SecretBytes | None = None
    blind_index: SecretBytes | None = None
    password_pepper: SecretBytes | None = None
    otp_hmac: SecretBytes | None = None
    cursor_signing: SecretBytes | None = None
    field_keyring: FieldKeyring | None = None

    def require(self, name: KeyName) -> bytes:
        key: SecretBytes | None = getattr(self, name)
        if key is None:
            raise ConfigError(f"key {name!r} is not configured")
        return key.get_secret_value()


@dataclass(frozen=True, slots=True)
class ProviderSecrets:
    google_client_secret: SecretStr | None = None
    smtp_password: SecretStr | None = None
    whatsapp_access_token: SecretStr | None = None
    whatsapp_app_secret: SecretStr | None = None
    whatsapp_webhook_verify_token: SecretStr | None = None
    msg91_auth_key: SecretStr | None = None


def _load_key_file(path: Path) -> tuple[SecretBytes | None, str | None]:
    """Return (key, problem); ``problem == "missing"`` when the file does not exist."""
    if not path.is_file():
        return None, "missing"
    try:
        raw = path.read_text(encoding="utf-8").strip()
    except OSError:
        return None, "unreadable"
    try:
        data = base64.b64decode(raw, validate=True)
    except binascii.Error, ValueError:
        return None, "not valid base64"
    if len(data) != KEY_BYTES:
        return None, f"must decode to exactly {KEY_BYTES} bytes"
    return SecretBytes(data), None


def _load_keyring(path: Path) -> tuple[FieldKeyring | None, str | None]:
    if not path.is_file():
        return None, "missing"
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except OSError:
        return None, "unreadable"
    except ValueError:
        return None, "not valid JSON"
    if not isinstance(doc, dict) or not isinstance(doc.get("keys"), dict) or not doc["keys"]:
        return None, "must be an object with 'active' and a non-empty 'keys' object"
    active = doc.get("active")
    if not isinstance(active, str) or active not in doc["keys"]:
        return None, "'active' must name one of the key ids"
    keys: dict[str, SecretBytes] = {}
    for key_id, encoded in doc["keys"].items():
        if not KEY_ID_RE.fullmatch(key_id):
            return None, f"key ids must match {KEY_ID_RE.pattern}"
        try:
            data = base64.b64decode(str(encoded), validate=True)
        except binascii.Error, ValueError:
            return None, f"key {key_id!r} is not valid base64"
        if len(data) != KEY_BYTES:
            return None, f"key {key_id!r} must decode to exactly {KEY_BYTES} bytes"
        keys[key_id] = SecretBytes(data)
    return FieldKeyring(active=active, keys=keys), None


def _read_optional_secret(path: Path | None) -> tuple[SecretStr | None, str | None]:
    if path is None or not path.is_file():
        return None, None
    try:
        value = path.read_text(encoding="utf-8").strip()
    except OSError:
        return None, "unreadable"
    return (SecretStr(value) if value else None), None


# ---- settings -------------------------------------------------------------------------------


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
        case_sensitive=False,
        validate_default=True,
        hide_input_in_errors=True,
    )

    # ---- Application
    app_env: Literal["development", "test", "production"] = "development"
    app_name: str = "bloomcraft-api"
    api_base_url: HttpUrlStr = "http://localhost:8000"
    api_prefix: Annotated[str, AfterValidator(_api_prefix)] = "/api/v1"
    frontend_base_url: HttpUrlStr = "http://localhost:5173"
    cors_allowed_origins: OriginList = ["http://localhost:5173"]
    trusted_proxy_ips: NetworkList = []
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    log_format: Literal["console", "json"] = "console"
    business_timezone: Annotated[str, AfterValidator(_timezone)] = "Asia/Kolkata"
    enable_api_docs: bool = True

    # ---- PostgreSQL
    database_url: SecretStr
    database_migrator_url: SecretStr | None = None
    test_database_url: SecretStr | None = None
    test_database_migrator_url: SecretStr | None = None
    db_schema: str = "bloomcraft"
    db_pool_size: PositiveInt = 10
    db_max_overflow: NonNegativeInt = 5
    db_statement_timeout_ms: PositiveInt = 5000

    # ---- Sessions, cookies, CSRF
    cookie_prefix: Literal["", "__Host-"] = ""
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    session_idle_ttl_seconds: PositiveInt = 604800
    session_absolute_ttl_seconds: PositiveInt = 2592000
    admin_session_idle_ttl_seconds: PositiveInt = 1800
    admin_session_absolute_ttl_seconds: PositiveInt = 43200
    step_up_max_age_seconds: PositiveInt = 600
    csrf_secret_file: RepoPath = Path("backend/secrets/csrf_secret.key")

    # ---- Cryptography
    field_encryption_keyring_file: RepoPath = Path("backend/secrets/field_keyring.json")
    blind_index_key_file: RepoPath = Path("backend/secrets/blind_index.key")
    password_pepper_file: RepoPath = Path("backend/secrets/password_pepper.key")
    otp_hmac_key_file: RepoPath = Path("backend/secrets/otp_hmac.key")
    cursor_signing_key_file: RepoPath = Path("backend/secrets/cursor_signing.key")
    argon2_memory_kib: PositiveInt = 19456
    argon2_time_cost: PositiveInt = 2
    argon2_parallelism: PositiveInt = 1
    password_min_length: PositiveInt = 15
    password_max_length: PositiveInt = 128
    hibp_check_enabled: bool = False

    # ---- Google OAuth / OIDC
    google_client_id: str | None = None
    google_client_secret: SecretStr | None = None
    google_client_secret_file: RepoPath | None = Path("backend/secrets/google_client_secret.txt")
    google_discovery_url: HttpUrlStr = (
        "https://accounts.google.com/.well-known/openid-configuration"
    )
    oauth_redirect_base_url: HttpUrlStr = "http://localhost:8000"
    oauth_transaction_ttl_seconds: PositiveInt = 600
    oauth_pending_signup_ttl_seconds: PositiveInt = 900

    # ---- TOTP
    totp_issuer: str = "BloomCraft"
    admin_mfa_required: bool = True

    # ---- Email
    email_backend: Literal["smtp", "console"] = "smtp"
    smtp_host: str = "127.0.0.1"
    smtp_port: Annotated[int, Field(ge=1, le=65535)] = 1025
    smtp_username: str | None = None
    smtp_password_file: RepoPath | None = Path("backend/secrets/smtp_password.txt")
    smtp_security: Literal["none", "starttls", "tls"] = "none"
    email_from: str = "BloomCraft <no-reply@bloomcraft.in>"
    email_reply_to: EmailStr = "hello@bloomcraft.in"
    mailpit_api_url: HttpUrlStr | None = "http://127.0.0.1:8025"

    # ---- WhatsApp
    whatsapp_enabled: bool = False
    whatsapp_graph_base_url: HttpUrlStr = "https://graph.facebook.com"
    whatsapp_graph_api_version: str | None = None
    whatsapp_phone_number_id: str | None = None
    whatsapp_business_account_id: str | None = None
    whatsapp_access_token_file: RepoPath | None = Path("backend/secrets/whatsapp_token.txt")
    whatsapp_app_secret_file: RepoPath | None = Path("backend/secrets/whatsapp_app_secret.txt")
    whatsapp_webhook_verify_token_file: RepoPath | None = Path(
        "backend/secrets/whatsapp_verify_token.txt"
    )
    whatsapp_template_language: str = "en"
    whatsapp_template_order_placed: str = "bc_order_placed_v1"
    whatsapp_template_seller_new_order: str = "bc_seller_new_order_v1"
    whatsapp_template_order_status: str = "bc_order_status_v1"
    whatsapp_template_otp: str = "bc_otp_v1"

    # ---- SMS
    sms_enabled: bool = False
    sms_provider: Literal["msg91"] = "msg91"
    msg91_auth_key_file: RepoPath | None = Path("backend/secrets/msg91_auth_key.txt")
    msg91_sender_id: str | None = None
    msg91_dlt_template_id_otp: str | None = None
    msg91_dlt_template_id_order: str | None = None

    # ---- Media
    media_backend: Literal["local", "s3"] = "local"
    media_root: RepoPath = Path("backend/var/media")
    media_private_root: RepoPath = Path("backend/var/private_media")
    media_max_upload_bytes: PositiveInt = 5242880
    media_max_pixels: PositiveInt = 40000000

    # ---- Worker
    worker_id: str = "worker-1"
    worker_poll_interval_seconds: PositiveInt = 5
    worker_concurrency_auth: PositiveInt = 4
    worker_concurrency_transactional: PositiveInt = 4
    worker_concurrency_bulk: PositiveInt = 1
    outbox_max_attempts: PositiveInt = 8
    otp_message_stale_after_seconds: PositiveInt = 120

    # ---- Business defaults
    founding_seller_email: EmailStr | None = None
    legacy_import_dir: RepoPath = Path("backend/var/imports")
    require_verified_phone_for_checkout: bool = False
    seller_pii_visible_days_after_close: PositiveInt = 30

    # ---- Rate limits
    rate_limit_login_account: RateLimitSpec = RateLimit(count=5, window_seconds=900)
    rate_limit_login_ip: RateLimitSpec = RateLimit(count=30, window_seconds=900)
    rate_limit_register_start_email: RateLimitSpec = RateLimit(count=3, window_seconds=900)
    rate_limit_register_start_ip: RateLimitSpec = RateLimit(count=10, window_seconds=3600)
    rate_limit_password_forgot_email: RateLimitSpec = RateLimit(count=3, window_seconds=3600)
    rate_limit_password_forgot_ip: RateLimitSpec = RateLimit(count=10, window_seconds=3600)
    rate_limit_otp_send_target: RateLimitSpec = RateLimit(count=3, window_seconds=900)
    rate_limit_otp_send_target_daily: RateLimitSpec = RateLimit(count=10, window_seconds=86400)
    rate_limit_otp_send_user: RateLimitSpec = RateLimit(count=5, window_seconds=3600)
    rate_limit_mfa_verify_user: RateLimitSpec = RateLimit(count=5, window_seconds=300)
    rate_limit_google_start_ip: RateLimitSpec = RateLimit(count=20, window_seconds=600)
    rate_limit_checkout_user: RateLimitSpec = RateLimit(count=10, window_seconds=60)
    rate_limit_custom_request_user: RateLimitSpec = RateLimit(count=5, window_seconds=86400)
    rate_limit_upload_user: RateLimitSpec = RateLimit(count=30, window_seconds=3600)
    rate_limit_global_ip: RateLimitSpec = RateLimit(count=300, window_seconds=60)

    _keys: KeyMaterial = PrivateAttr(default_factory=KeyMaterial)
    _provider_secrets: ProviderSecrets = PrivateAttr(default_factory=ProviderSecrets)

    @model_validator(mode="before")
    @classmethod
    def _drop_comment_only_values(cls, data: object) -> object:
        """python-dotenv reads ``KEY=   # comment`` as the value ``# comment``; an empty
        value followed by an inline comment means "unset"."""
        if isinstance(data, dict):
            return {
                k: v
                for k, v in data.items()
                if not (isinstance(v, str) and v.lstrip().startswith("#"))
            }
        return data

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def keys(self) -> KeyMaterial:
        return self._keys

    @property
    def provider_secrets(self) -> ProviderSecrets:
        return self._provider_secrets

    @property
    def runtime_dirs(self) -> tuple[Path, ...]:
        return (
            self.media_root,
            self.media_private_root,
            self.legacy_import_dir,
            BACKEND_DIR / "var" / "logs",
        )

    @model_validator(mode="after")
    def _load_secrets_and_check(self) -> Self:
        errors: list[str] = []
        production = self.is_production

        key_files: dict[KeyName, tuple[str, Path]] = {
            "csrf_secret": ("CSRF_SECRET_FILE", self.csrf_secret_file),
            "blind_index": ("BLIND_INDEX_KEY_FILE", self.blind_index_key_file),
            "password_pepper": ("PASSWORD_PEPPER_FILE", self.password_pepper_file),
            "otp_hmac": ("OTP_HMAC_KEY_FILE", self.otp_hmac_key_file),
            "cursor_signing": ("CURSOR_SIGNING_KEY_FILE", self.cursor_signing_key_file),
        }
        loaded: dict[str, SecretBytes | None] = {}
        for name, (env_name, path) in key_files.items():
            key, problem = _load_key_file(path)
            if problem and (production or problem != "missing"):
                errors.append(f"{env_name} ({path}): {problem}")
            loaded[name] = key
        keyring, problem = _load_keyring(self.field_encryption_keyring_file)
        if problem and (production or problem != "missing"):
            errors.append(
                f"FIELD_ENCRYPTION_KEYRING_FILE ({self.field_encryption_keyring_file}): {problem}"
            )
        self._keys = KeyMaterial(
            csrf_secret=loaded["csrf_secret"],
            blind_index=loaded["blind_index"],
            password_pepper=loaded["password_pepper"],
            otp_hmac=loaded["otp_hmac"],
            cursor_signing=loaded["cursor_signing"],
            field_keyring=keyring,
        )

        secret_files: dict[str, tuple[str, Path | None]] = {
            "google_client_secret": ("GOOGLE_CLIENT_SECRET_FILE", self.google_client_secret_file),
            "smtp_password": ("SMTP_PASSWORD_FILE", self.smtp_password_file),
            "whatsapp_access_token": (
                "WHATSAPP_ACCESS_TOKEN_FILE",
                self.whatsapp_access_token_file,
            ),
            "whatsapp_app_secret": ("WHATSAPP_APP_SECRET_FILE", self.whatsapp_app_secret_file),
            "whatsapp_webhook_verify_token": (
                "WHATSAPP_WEBHOOK_VERIFY_TOKEN_FILE",
                self.whatsapp_webhook_verify_token_file,
            ),
            "msg91_auth_key": ("MSG91_AUTH_KEY_FILE", self.msg91_auth_key_file),
        }
        secrets: dict[str, SecretStr | None] = {}
        for secret_name, (env_name, secret_path) in secret_files.items():
            value, problem = _read_optional_secret(secret_path)
            if problem:
                errors.append(f"{env_name} ({secret_path}): {problem}")
            secrets[secret_name] = value
        if self.google_client_secret is not None and self.google_client_secret.get_secret_value():
            secrets["google_client_secret"] = self.google_client_secret
        self._provider_secrets = ProviderSecrets(**secrets)

        if "*" in self.cors_allowed_origins:
            errors.append("CORS_ALLOWED_ORIGINS must list exact origins, never '*'")
        if production:
            errors.extend(self._production_violations())

        if errors:
            raise ValueError("Invalid configuration:\n  - " + "\n  - ".join(errors))
        return self

    def _production_violations(self) -> list[str]:
        violations: list[str] = []
        if not self.cookie_secure:
            violations.append("COOKIE_SECURE must be true in production")
        if self.cookie_prefix != "__Host-":
            violations.append("COOKIE_PREFIX must be '__Host-' in production")
        if self.enable_api_docs:
            violations.append("ENABLE_API_DOCS must be false in production")
        for env_name, url in (
            ("API_BASE_URL", self.api_base_url),
            ("FRONTEND_BASE_URL", self.frontend_base_url),
            ("OAUTH_REDIRECT_BASE_URL", self.oauth_redirect_base_url),
        ):
            if urlsplit(url).scheme != "https":
                violations.append(f"{env_name} must use https in production")
        for origin in self.cors_allowed_origins:
            if origin != "*" and urlsplit(origin).scheme != "https":
                violations.append(f"CORS_ALLOWED_ORIGINS entry {origin!r} must use https")
        if self.smtp_security == "none":
            violations.append("SMTP_SECURITY must be 'starttls' or 'tls' in production")
        if self.log_format != "json":
            violations.append("LOG_FORMAT must be 'json' in production")
        return violations


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
