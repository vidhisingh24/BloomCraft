"""``bloomcraft create-admin`` / ``create-seller`` through CliRunner; rows read via the migrator."""

import logging
from typing import Any

import pytest
import structlog
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app import cli
from app.auth.models import BlockedIdentifier
from app.core.config import Settings
from app.crypto import install_crypto
from app.crypto.blind_index import blind_index
from app.crypto.passwords import verify_password
from tests.cli_helpers import as_system, invoke, query
from tests.factories import create_user

pytestmark = pytest.mark.db

PASSPHRASE = "zebra lantern quartz meadow"
OWNER = "owner@example.test"


def prompt_input(*passwords: str) -> str:
    """Hidden prompt with confirmation: each password typed twice."""
    return "".join(f"{p}\n{p}\n" for p in passwords)


def admin(
    monkeypatch: pytest.MonkeyPatch,
    settings: Settings,
    *extra: str,
    email: str = OWNER,
    input: str | None = None,
) -> Any:
    args = ("create-admin", "--email", email, "--name", "Owner Singh", *extra)
    return invoke(monkeypatch, settings, *args, input=input)


def users(settings: Settings) -> Any:
    return query(
        settings,
        "SELECT id, password_hash, created_via, email_verified_at, consent_terms_version, "
        "consent_privacy_version, consent_at FROM bloomcraft.users",
    )


def grants(settings: Settings, user_id: Any) -> dict[str, tuple[str, str]]:
    rows = query(
        settings,
        "SELECT role, status, granted_via FROM bloomcraft.user_roles WHERE user_id = :u",
        u=user_id,
    )
    return {role: (status, via) for role, status, via in rows}


def audit_actions(settings: Settings) -> list[str]:
    return [
        row[0] for row in query(settings, "SELECT action FROM bloomcraft.audit_log ORDER BY id")
    ]


# ---- create-admin ---------------------------------------------------------------------------


def test_create_admin_with_hidden_prompt(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    result = admin(monkeypatch, test_settings, input=prompt_input("too short", PASSPHRASE))
    assert result.exit_code == 0, result.output
    assert "password rejected: Use at least 15 characters." in result.output
    assert "admin account " in result.output
    assert "TOTP enrolment required at first sign-in" in result.output

    rows = users(test_settings)
    assert len(rows) == 1
    user_id, password_hash, created_via, verified_at, *consents = rows[0]
    assert password_hash.startswith("p1$")
    install_crypto(test_settings)
    assert verify_password(PASSPHRASE, password_hash)
    assert created_via == "bootstrap_cli"
    assert verified_at is not None
    assert consents == [None, None, None]
    assert grants(test_settings, user_id) == {
        "customer": ("active", "bootstrap"),
        "admin": ("active", "bootstrap"),
    }
    assert audit_actions(test_settings) == ["bootstrap.create_admin"]
    assert str(user_id) in result.output


def test_three_rejected_passwords_exit_1(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    result = admin(monkeypatch, test_settings, input=prompt_input("short", "passwordpassword", "x"))
    assert result.exit_code == 1
    assert result.output.count("password rejected:") == 3
    assert users(test_settings) == []


def test_second_admin_is_refused(monkeypatch: pytest.MonkeyPatch, test_settings: Settings) -> None:
    assert admin(monkeypatch, test_settings, input=prompt_input(PASSPHRASE)).exit_code == 0
    before = (users(test_settings), audit_actions(test_settings))
    result = invoke(
        monkeypatch,
        test_settings,
        "create-admin",
        "--email",
        "second@example.test",
        "--name",
        "Second",
        "--password-stdin",
        input=PASSPHRASE + "\n",
    )
    assert result.exit_code == 1
    assert "refused: an admin already exists — use invitations" in result.output
    assert (users(test_settings), audit_actions(test_settings)) == before


def test_password_stdin_single_attempt(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    result = admin(monkeypatch, test_settings, "--password-stdin", input="short\r\n")
    assert result.exit_code == 1
    assert result.output.count("password rejected:") == 1
    ok = admin(monkeypatch, test_settings, "--password-stdin", input="﻿" + PASSPHRASE + "\r\n")
    assert ok.exit_code == 0, ok.output
    install_crypto(test_settings)
    assert verify_password(PASSPHRASE, users(test_settings)[0][1])


def test_existing_customer_becomes_admin_without_password(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    async def make(session: AsyncSession) -> Any:
        return (await create_user(session, full_name="Cust", email="cust@example.test")).id

    user_id = as_system(test_settings, make)
    result = admin(monkeypatch, test_settings, email="CUST@Example.test")  # no input: no prompt
    assert result.exit_code == 0, result.output
    assert f"admin grant added to existing account {user_id}" in result.output
    assert grants(test_settings, user_id)["admin"] == ("active", "bootstrap")
    assert len(users(test_settings)) == 1


def test_suspended_admin_grant_is_reactivated_when_no_admin_is_left(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    async def make(session: AsyncSession) -> Any:
        user = await create_user(
            session,
            full_name="Old Admin",
            email="old@example.test",
            roles={"customer": "active", "admin": "suspended"},
        )
        return user.id

    user_id = as_system(test_settings, make)
    result = admin(monkeypatch, test_settings, email="old@example.test")
    assert result.exit_code == 0, result.output
    assert grants(test_settings, user_id)["admin"] == ("active", "bootstrap")


# ---- create-seller --------------------------------------------------------------------------


def test_seller_on_the_admin_account(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    assert admin(monkeypatch, test_settings, input=prompt_input(PASSPHRASE)).exit_code == 0
    assert invoke(monkeypatch, test_settings, "seed", "--settings").exit_code == 0
    user_id = users(test_settings)[0][0]

    args = ("create-seller", "--email", "OWNER@Example.TEST", "--name", "Owner Singh")
    result = invoke(monkeypatch, test_settings, *args, "--shop-name", "BloomCraft Studio")
    assert result.exit_code == 0, result.output
    assert (
        f"seller grant added to existing account {user_id} (shop slug bloomcraft-studio)"
        in result.output
    )
    assert "note: set FOUNDING_SELLER_EMAIL" in result.output
    assert len(users(test_settings)) == 1
    assert grants(test_settings, user_id)["seller"] == ("active", "bootstrap")
    profile = query(
        test_settings, "SELECT user_id, shop_name, slug FROM bloomcraft.seller_profiles"
    )
    assert [tuple(r) for r in profile] == [(user_id, "BloomCraft Studio", "bloomcraft-studio")]
    config = query(test_settings, "SELECT config, version FROM bloomcraft.store_settings")[0]
    assert config[0]["default_custom_request_seller_id"] == str(user_id)
    assert config[1] == 2
    assert audit_actions(test_settings)[-2:] == [
        "bootstrap.create_seller",
        "store_settings.default_seller_set",
    ]

    again = invoke(monkeypatch, test_settings, *args, "--shop-name", "Another Shop")
    assert again.exit_code == 1
    assert "refused: this account is already a seller" in again.output


def test_new_seller_account_and_founding_email_note(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    settings = test_settings.model_copy(update={"founding_seller_email": "maker@example.test"})
    result = invoke(
        monkeypatch,
        settings,
        "create-seller",
        "--email",
        "maker@example.test",
        "--name",
        "Maker",
        "--shop-name",
        "Knotty Marigold",
        "--slug",
        "knotty",
        "--password-stdin",
        input=PASSPHRASE + "\n",
    )
    assert result.exit_code == 0, result.output
    assert "seller account " in result.output
    assert "(shop slug knotty)" in result.output
    assert "FOUNDING_SELLER_EMAIL" not in result.output
    user_id = users(test_settings)[0][0]
    assert grants(test_settings, user_id) == {
        "customer": ("active", "bootstrap"),
        "seller": ("active", "bootstrap"),
    }


def test_shop_name_is_part_of_the_password_context(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    result = invoke(
        monkeypatch,
        test_settings,
        "create-seller",
        "--email",
        "maker@example.test",
        "--name",
        "Maker",
        "--shop-name",
        "Knotty Marigold",
        "--password-stdin",
        input="knottymarigold2026\n",
    )
    assert result.exit_code == 1
    assert "password rejected: This password is too easy to guess" in result.output


# ---- refusals -------------------------------------------------------------------------------


def _seller_args(email: str, *extra: str) -> list[str]:
    return [
        "create-seller",
        "--email",
        email,
        "--name",
        "Maker",
        "--shop-name",
        "Maker Shop",
        *extra,
    ]


def test_refusals(monkeypatch: pytest.MonkeyPatch, test_settings: Settings) -> None:
    async def make(session: AsyncSession) -> None:
        session.add(
            BlockedIdentifier(kind="email", value_bidx=blind_index("email", "blocked@example.test"))
        )
        await create_user(session, full_name="S", email="susp@example.test", status="suspended")
        await create_user(
            session,
            full_name="P",
            email="pending@example.test",
            roles={"customer": "active", "seller": "pending"},
        )
        await session.flush()

    as_system(test_settings, make)
    assert (
        invoke(
            monkeypatch,
            test_settings,
            *_seller_args("maker@example.test", "--slug", "taken"),
            "--password-stdin",
            input=PASSPHRASE + "\n",
        ).exit_code
        == 0
    )
    production = test_settings.model_copy(update={"app_env": "production"})
    cases: list[tuple[Settings, list[str], str]] = [
        (
            test_settings,
            ["create-admin", "--email", "blocked@example.test", "--name", "B"],
            "this email is blocked",
        ),
        (test_settings, _seller_args("susp@example.test"), "the existing account is suspended"),
        (
            test_settings,
            _seller_args("pending@example.test"),
            "this account's seller grant is pending — decide it in the admin console",
        ),
        (
            test_settings,
            _seller_args("new@example.test", "--slug", "taken"),
            "slug 'taken' is taken; pass --slug",
        ),
        (
            test_settings,
            ["create-admin", "--email", "not-an-email", "--name", "N"],
            "invalid email address",
        ),
        (
            production,
            ["create-admin", "--email", OWNER, "--name", "Owner"],
            "invalid email address",
        ),
        (
            test_settings,
            ["create-admin", "--email", OWNER, "--name", "Own\x07er"],
            "name must not contain control characters",
        ),
        (test_settings, _seller_args("new@example.test", "--slug", "Bad Slug"), "slug must match"),
    ]
    before = users(test_settings)
    for settings, args, message in cases:
        result = invoke(monkeypatch, settings, *args, input="")
        assert result.exit_code == 1, (args, result.output)
        assert f"refused: {message}" in result.output, (args, result.output)
    assert users(test_settings) == before


# ---- the password never leaks ---------------------------------------------------------------


def test_password_never_leaks(
    monkeypatch: pytest.MonkeyPatch,
    test_settings: Settings,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setattr(cli, "configure_logging", lambda settings: None)  # keep caplog attached
    caplog.set_level(logging.DEBUG)
    with structlog.testing.capture_logs() as logs:
        result = admin(monkeypatch, test_settings, input=prompt_input("short", PASSPHRASE))
        seller = invoke(
            monkeypatch,
            test_settings,
            *_seller_args("maker2@example.test"),
            "--password-stdin",
            input=PASSPHRASE + "\n",
        )
    assert result.exit_code == 0, result.output
    assert seller.exit_code == 0, seller.output
    audit_rows = query(test_settings, "SELECT a::text FROM bloomcraft.audit_log a")
    haystacks = [result.output, seller.output, str(logs), caplog.text, str(audit_rows)]
    for haystack in haystacks:
        assert PASSPHRASE not in haystack
        assert "p1$" not in haystack
    assert any(e.get("event") == "system_context" for e in logs)


def test_database_error_prints_type_and_sqlstate_only(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    async def failing(session: AsyncSession, request: Any, password_hash: str | None) -> Any:
        raise IntegrityError(
            "INSERT INTO bloomcraft.users (password_hash) VALUES ($1)",
            {"password_hash": password_hash, "p": PASSPHRASE},
            Exception(f"duplicate key; password {PASSPHRASE}"),
        )

    monkeypatch.setattr(cli, "create_admin", failing)
    result = admin(monkeypatch, test_settings, "--password-stdin", input=PASSPHRASE + "\n")
    assert result.exit_code == 1
    assert "database error: IntegrityError (SQLSTATE n/a)" in result.output
    assert PASSPHRASE not in result.output
    assert "p1$" not in result.output
    assert users(test_settings) == []
