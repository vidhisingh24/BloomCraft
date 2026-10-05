import os
import re
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from app.core.config import BACKEND_DIR, REPO_ROOT, ConfigError, RateLimit, Settings
from tests.conftest import write_key_files

DSN = "postgresql+asyncpg://bloomcraft_app:pw-must-not-leak@127.0.0.1:5432/bloomcraft"


@pytest.fixture(autouse=True)
def _isolated_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """No real environment variables leak into these settings (``.env`` is disabled per call)."""
    for name in list(os.environ):
        if name.upper() in {f.upper() for f in Settings.model_fields}:
            monkeypatch.delenv(name, raising=False)


def make(**overrides: Any) -> Settings:
    values: dict[str, Any] = {"database_url": DSN}
    values.update(overrides)
    return Settings(_env_file=None, **values)  # type: ignore[call-arg]


def production_ok(keys: dict[str, Path]) -> dict[str, Any]:
    return {
        "app_env": "production",
        "cookie_secure": True,
        "cookie_prefix": "__Host-",
        "enable_api_docs": False,
        "api_base_url": "https://api.bloomcraft.in",
        "frontend_base_url": "https://bloomcraft.in",
        "oauth_redirect_base_url": "https://api.bloomcraft.in",
        "cors_allowed_origins": "https://bloomcraft.in",
        "smtp_security": "starttls",
        "log_format": "json",
        **keys,
    }


def test_every_env_example_variable_has_a_field() -> None:
    names = {
        line.split("=", 1)[0]
        for line in (BACKEND_DIR / ".env.example").read_text(encoding="utf-8").splitlines()
        if re.match(r"^[A-Z0-9_]+=", line)
    }
    assert names == {name.upper() for name in Settings.model_fields}


def test_production_valid(tmp_path: Path) -> None:
    settings = make(**production_ok(write_key_files(tmp_path)))
    assert settings.is_production
    assert settings.keys.require("cursor_signing")


def test_production_violations_listed_together(tmp_path: Path) -> None:
    keys = write_key_files(tmp_path)
    keys["otp_hmac_key_file"].unlink()
    values = production_ok(keys)
    values.update(
        cookie_secure=False,
        cookie_prefix="",
        enable_api_docs=True,
        api_base_url="http://api.bloomcraft.in",
        frontend_base_url="http://bloomcraft.in",
        oauth_redirect_base_url="http://api.bloomcraft.in",
        cors_allowed_origins="http://bloomcraft.in,*",
        smtp_security="none",
        log_format="console",
    )
    with pytest.raises(ValidationError) as exc:
        make(**values)
    message = str(exc.value)
    assert exc.value.error_count() == 1
    for expected in (
        "COOKIE_SECURE must be true",
        "COOKIE_PREFIX must be '__Host-'",
        "ENABLE_API_DOCS must be false",
        "API_BASE_URL must use https",
        "FRONTEND_BASE_URL must use https",
        "OAUTH_REDIRECT_BASE_URL must use https",
        "CORS_ALLOWED_ORIGINS entry 'http://bloomcraft.in' must use https",
        "never '*'",
        "SMTP_SECURITY must be 'starttls' or 'tls'",
        "LOG_FORMAT must be 'json'",
        "OTP_HMAC_KEY_FILE",
        "missing",
    ):
        assert expected in message
    assert "pw-must-not-leak" not in message


def test_production_cookie_secure_false_alone(tmp_path: Path) -> None:
    values = production_ok(write_key_files(tmp_path))
    values["cookie_secure"] = False
    with pytest.raises(ValidationError, match="COOKIE_SECURE must be true in production"):
        make(**values)


def test_production_missing_key_file_alone(tmp_path: Path) -> None:
    keys = write_key_files(tmp_path)
    keys["field_encryption_keyring_file"].unlink()
    with pytest.raises(ValidationError, match=r"FIELD_ENCRYPTION_KEYRING_FILE .*: missing"):
        make(**production_ok(keys))


def test_development_tolerates_missing_keys(tmp_path: Path) -> None:
    settings = make(
        **{
            f: tmp_path / "absent.key"
            for f in (
                "csrf_secret_file",
                "blind_index_key_file",
                "password_pepper_file",
                "otp_hmac_key_file",
                "cursor_signing_key_file",
                "field_encryption_keyring_file",
            )
        }
    )
    assert settings.keys.cursor_signing is None
    with pytest.raises(ConfigError):
        settings.keys.require("cursor_signing")


@pytest.mark.parametrize(
    ("content", "problem"),
    [("c2hvcnQ=", "exactly 32 bytes"), ("%%%not base64%%%", "not valid base64")],
)
def test_invalid_key_file_fails_in_any_env(tmp_path: Path, content: str, problem: str) -> None:
    keys = write_key_files(tmp_path)
    keys["blind_index_key_file"].write_text(content, encoding="utf-8")
    with pytest.raises(ValidationError, match=f"BLIND_INDEX_KEY_FILE .*{problem}"):
        make(**keys)


@pytest.mark.parametrize(
    ("doc", "problem"),
    [
        ("{not json", "not valid JSON"),
        ('{"active": "k2", "keys": {"k1": "AAAA"}}', "'active' must name"),
        ('{"active": "k1", "keys": {}}', "non-empty 'keys'"),
        ('{"active": "k1", "keys": {"k1": "c2hvcnQ="}}', "key 'k1' must decode"),
    ],
)
def test_invalid_keyring(tmp_path: Path, doc: str, problem: str) -> None:
    keys = write_key_files(tmp_path)
    keys["field_encryption_keyring_file"].write_text(doc, encoding="utf-8")
    with pytest.raises(ValidationError, match=re.escape(problem)):
        make(**keys)


def test_keyring_repr_shows_ids_only(tmp_path: Path) -> None:
    keys = write_key_files(tmp_path)
    settings = make(**keys)
    ring = settings.keys.field_keyring
    assert ring is not None
    assert repr(ring) == "FieldKeyring(active='k1', key_ids=['k1'])"
    secret = ring.keys["k1"].get_secret_value()
    assert len(secret) == 32
    assert secret.hex() not in repr(settings)
    assert "pw-must-not-leak" not in repr(settings)
    assert "pw-must-not-leak" not in str(settings.model_dump())


def test_file_secrets(tmp_path: Path) -> None:
    google = tmp_path / "google.txt"
    google.write_text("  from-file \n", encoding="utf-8")
    smtp = tmp_path / "smtp.txt"
    smtp.write_text("\n", encoding="utf-8")
    settings = make(
        google_client_secret_file=google,
        smtp_password_file=smtp,
        whatsapp_access_token_file=tmp_path / "missing.txt",
    )
    secrets = settings.provider_secrets
    assert secrets.google_client_secret is not None
    assert secrets.google_client_secret.get_secret_value() == "from-file"
    assert secrets.smtp_password is None
    assert secrets.whatsapp_access_token is None
    assert "from-file" not in repr(secrets)

    inline = make(google_client_secret="inline-value", google_client_secret_file=google)
    assert inline.provider_secrets.google_client_secret is not None
    assert inline.provider_secrets.google_client_secret.get_secret_value() == "inline-value"


def test_paths_resolve_against_repo_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(tmp_path)
    settings = make(media_root="backend/var/media", legacy_import_dir="backend/var/imports")
    assert settings.media_root == REPO_ROOT / "backend" / "var" / "media"
    assert settings.legacy_import_dir.is_absolute()
    assert settings.csrf_secret_file == REPO_ROOT / "backend" / "secrets" / "csrf_secret.key"
    absolute = tmp_path / "elsewhere"
    assert make(media_root=str(absolute)).media_root == absolute


def test_env_file_loaded_independent_of_cwd(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    env_file = tmp_path / "custom.env"
    env_file.write_text(
        "DATABASE_URL=" + DSN + "\n"
        "TRUSTED_PROXY_IPS=                 # comment only means unset\n"
        "CORS_ALLOWED_ORIGINS=http://localhost:5173, http://127.0.0.1:5173  # two\n"
        "RATE_LIMIT_LOGIN_IP=7/60\n",
        encoding="utf-8",
    )
    monkeypatch.chdir(tmp_path)
    settings = Settings(_env_file=env_file)  # type: ignore[call-arg]
    assert settings.trusted_proxy_ips == []
    assert settings.cors_allowed_origins == ["http://localhost:5173", "http://127.0.0.1:5173"]
    assert settings.rate_limit_login_ip == RateLimit(count=7, window_seconds=60)


def test_rate_limits_and_lists() -> None:
    settings = make(
        rate_limit_global_ip="300/60",
        trusted_proxy_ips="10.0.0.1, 192.168.0.0/16, ::1",
        cors_allowed_origins="http://localhost:5173/",
    )
    assert settings.rate_limit_global_ip == RateLimit(count=300, window_seconds=60)
    assert str(settings.rate_limit_global_ip) == "300/60"
    assert [str(n) for n in settings.trusted_proxy_ips] == [
        "10.0.0.1/32",
        "192.168.0.0/16",
        "::1/128",
    ]
    assert settings.cors_allowed_origins == ["http://localhost:5173"]


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("rate_limit_global_ip", "300"),
        ("rate_limit_global_ip", "0/60"),
        ("rate_limit_global_ip", "a/b"),
        ("trusted_proxy_ips", "not-an-ip"),
        ("cors_allowed_origins", "http://localhost:5173/path"),
        ("cors_allowed_origins", "localhost:5173"),
        ("api_base_url", "ftp://x"),
        ("business_timezone", "Mars/Olympus"),
        ("api_prefix", "api/v1"),
        ("smtp_port", 0),
    ],
)
def test_invalid_values(field: str, value: object) -> None:
    with pytest.raises(ValidationError):
        make(**{field: value})
