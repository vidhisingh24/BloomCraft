import base64
import string
import uuid
from pathlib import Path
from typing import Any

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from app.core.config import ConfigError, FieldKeyring, KeyMaterial, Settings
from app.crypto import install_crypto
from app.crypto import passwords as pw
from app.crypto.blind_index import blind_index, normalize, normalize_email
from app.crypto.field_encryption import (
    FORMAT_VERSION,
    DecryptionError,
    decrypt_bytes,
    decrypt_json,
    decrypt_text,
    encrypt_bytes,
    encrypt_json,
    encrypt_text,
    key_id_of,
    reencrypt,
)
from app.crypto.keyring import (
    current_key_material,
    field_keyring,
    install_key_material,
    installed_key_material,
    require_key,
    uninstall_key_material,
)
from app.crypto.tokens import code_hmac, hash_token, new_numeric_code, new_token, tokens_equal
from tests.conftest import new_key, offline_settings, write_key_files, write_keyring

ROW = uuid.UUID("0199a6b2-3c4d-7e8f-9a0b-1c2d3e4f5a6b")
OTHER_ROW = uuid.UUID("0199a6b2-3c4d-7e8f-9a0b-1c2d3e4f5a6c")
WHERE: dict[str, Any] = {"table": "users", "column": "email", "row_id": ROW}

json_values = st.recursive(
    st.none() | st.booleans() | st.integers() | st.text(),
    lambda children: (
        st.lists(children, max_size=4) | st.dictionaries(st.text(max_size=8), children, max_size=4)
    ),
    max_leaves=12,
)


# ---- field encryption -----------------------------------------------------------------------


@given(st.text())
@settings(max_examples=60)
def test_text_round_trip(value: str) -> None:
    assert decrypt_text(encrypt_text(value, **WHERE), **WHERE) == value


@given(st.dictionaries(st.text(max_size=10), json_values, max_size=5) | st.lists(json_values))
@settings(max_examples=60)
def test_json_round_trip(value: Any) -> None:
    assert decrypt_json(encrypt_json(value, **WHERE), **WHERE) == value


def test_blob_format() -> None:
    blob = encrypt_text("asha@example.com", **WHERE)
    assert blob[0] == FORMAT_VERSION
    assert blob[1] == len(b"k1")
    assert blob[2:4] == b"k1"
    assert key_id_of(blob) == "k1"
    # version + length + key id + 12-byte nonce + ciphertext + 16-byte tag
    assert len(blob) == 2 + 2 + 12 + len("asha@example.com") + 16
    assert b"asha" not in blob


def test_same_value_encrypts_differently() -> None:
    assert encrypt_text("same", **WHERE) != encrypt_text("same", **WHERE)


@pytest.mark.parametrize(
    "moved",
    [
        {"table": "users", "column": "email", "row_id": OTHER_ROW},  # another row
        {"table": "users", "column": "phone", "row_id": ROW},  # another column
        {"table": "legacy_customers", "column": "email", "row_id": ROW},  # another table
    ],
)
def test_ciphertext_bound_to_table_column_row(moved: dict[str, Any]) -> None:
    blob = encrypt_text("asha@example.com", **WHERE)
    with pytest.raises(DecryptionError) as exc:
        decrypt_text(blob, **moved)
    assert "asha" not in str(exc.value)


def _tampered() -> list[bytes]:
    blob = encrypt_text("asha@example.com", **WHERE)
    flipped = bytearray(blob)
    flipped[-1] ^= 0x01
    nonce_flipped = bytearray(blob)
    nonce_flipped[5] ^= 0x80
    unknown = b"\x01\x02k9" + blob[4:]
    return [
        bytes(flipped),
        bytes(nonce_flipped),
        blob[:20],
        blob[:3],
        b"",
        b"\x02" + blob[1:],
        b"\x01\x00" + blob[2:],
        b"\x01\x02\xff\xfe" + blob[4:],
        unknown,
    ]


@pytest.mark.parametrize("blob", _tampered())
def test_tampered_truncated_or_unknown_key_fails(blob: bytes) -> None:
    with pytest.raises(DecryptionError) as exc:
        decrypt_text(blob, **WHERE)
    assert "asha" not in str(exc.value)


def test_decrypt_rejects_non_bytes() -> None:
    with pytest.raises(DecryptionError):
        decrypt_bytes("not-bytes", **WHERE)  # type: ignore[arg-type]


def test_keyring_rotation_and_reencrypt() -> None:
    k1, k2 = new_key(), new_key()
    from pydantic import SecretBytes

    both = FieldKeyring("k2", {"k1": SecretBytes(k1), "k2": SecretBytes(k2)})
    only_k1 = FieldKeyring("k1", {"k1": SecretBytes(k1)})
    only_k2 = FieldKeyring("k2", {"k2": SecretBytes(k2)})
    old = encrypt_bytes(b"secret", keyring=only_k1, **WHERE)
    assert key_id_of(old) == "k1"
    assert key_id_of(encrypt_bytes(b"x", keyring=both, **WHERE)) == "k2"  # active key
    new = reencrypt(old, to_key_id="k2", keyring=both, **WHERE)
    assert key_id_of(new) == "k2"
    assert decrypt_bytes(new, keyring=only_k2, **WHERE) == b"secret"
    with pytest.raises(DecryptionError, match="'k1' is not in the keyring"):
        decrypt_bytes(old, keyring=only_k2, **WHERE)
    with pytest.raises(DecryptionError):
        encrypt_bytes(b"x", keyring=only_k2, key_id="k1", **WHERE)


# ---- keyring --------------------------------------------------------------------------------


def test_keyring_install_and_fallback(crypto_settings: Settings) -> None:
    assert current_key_material() is crypto_settings.keys
    empty = KeyMaterial()
    install_key_material(empty)
    try:
        with pytest.raises(ConfigError, match="'blind_index' is not configured") as exc:
            require_key("blind_index")
        assert "bytes" not in str(exc.value)
        with pytest.raises(ConfigError, match="field_keyring"):
            field_keyring()
    finally:
        uninstall_key_material()
    assert installed_key_material() is None  # falls back to get_settings().keys


@pytest.mark.parametrize("bad_id", ["k 1", "", "x" * 33, "k/1", "ключ"])
def test_config_rejects_bad_key_ids(tmp_path: Path, bad_id: str) -> None:
    files = write_key_files(tmp_path)
    write_keyring(files["field_encryption_keyring_file"], {bad_id: new_key()}, bad_id)
    with pytest.raises(ValueError, match="key ids must match"):
        offline_settings(files)


# ---- blind index ----------------------------------------------------------------------------


def test_blind_index_normalisation() -> None:
    assert normalize_email(" Asha@Example.COM ") == "asha@example.com"
    assert blind_index("email", " Asha@Example.COM ") == blind_index("email", "asha@example.com")
    assert normalize("email", chr(0xFF21) + "sha@example.com") == "asha@example.com"  # NFKC
    assert blind_index("phone", "+91 98765 43210") == blind_index("phone", "09876543210")
    assert normalize("phone", "98765-43210") == "+919876543210"
    assert normalize("google_sub", "1234567890") == "1234567890"
    assert normalize("ip", " 2001:DB8::1 ") == "2001:db8::1"
    assert len(blind_index("ip", "203.0.113.7")) == 32


def test_blind_index_kind_separation() -> None:
    assert blind_index("google_sub", "1234567890") != blind_index("email", "1234567890")
    assert blind_index("email", "a@b.co") != blind_index("google_sub", "a@b.co")


def test_blind_index_depends_on_key(tmp_path: Path) -> None:
    before = blind_index("email", "asha@example.com")
    install_crypto(offline_settings(write_key_files(tmp_path)))
    assert blind_index("email", "asha@example.com") != before


@pytest.mark.parametrize(
    ("kind", "value"), [("email", "   "), ("phone", "12345"), ("google_sub", ""), ("ip", "x")]
)
def test_blind_index_rejects_bad_values(kind: Any, value: str) -> None:
    with pytest.raises(ValueError):
        blind_index(kind, value)


def test_normalize_rejects_unknown_kind() -> None:
    with pytest.raises(ValueError):
        normalize("nope", "x")  # type: ignore[arg-type]


# ---- passwords ------------------------------------------------------------------------------


def test_password_hash_and_verify() -> None:
    stored = pw.hash_password("correct horse battery staple")
    assert stored.startswith("p1$$argon2id$")
    assert pw.verify_password("correct horse battery staple", stored)
    assert not pw.verify_password("wrong horse battery staple", stored)
    assert pw.hash_password("same") != pw.hash_password("same")  # salted


def test_password_other_pepper_fails(tmp_path: Path) -> None:
    stored = pw.hash_password("correct horse battery staple")
    install_crypto(offline_settings(write_key_files(tmp_path)))
    assert not pw.verify_password("correct horse battery staple", stored)


@pytest.mark.parametrize(
    "stored", ["$argon2id$v=19$m=1024,t=1,p=1$abc$def", "p2$whatever", "p1$not-a-hash", "", None]
)
def test_verify_rejects_unknown_prefix_or_garbage(stored: str | None) -> None:
    assert pw.verify_password("anything", stored) is False


def test_verify_never_raises_on_bad_input() -> None:
    assert pw.verify_password(None, pw.hash_password("x")) is False  # type: ignore[arg-type]
    assert pw.verify_password("x", 42) is False  # type: ignore[arg-type]


def test_needs_rehash() -> None:
    stored = pw.hash_password("pw-under-test")
    assert not pw.needs_rehash(stored)
    pw.configure_password_hashing(pw.Argon2Parameters(memory_kib=2048, time_cost=1, parallelism=1))
    assert pw.needs_rehash(stored)
    assert pw.verify_password("pw-under-test", stored)  # old hashes still verify
    assert pw.needs_rehash("p0$" + stored[3:])  # older pepper version
    assert pw.needs_rehash("p1$garbage")


def test_argon2_defaults() -> None:
    defaults = pw.Argon2Parameters()
    assert (defaults.memory_kib, defaults.time_cost, defaults.parallelism) == (19456, 2, 1)
    fields = Settings.model_fields
    assert fields["argon2_memory_kib"].default == 19456
    assert fields["argon2_time_cost"].default == 2
    assert fields["argon2_parallelism"].default == 1


def test_parameters_fall_back_to_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(pw, "_parameters", None)
    assert pw.current_parameters().memory_kib > 0


def test_dummy_verify_runs() -> None:
    pw.dummy_verify("whatever")
    pw.dummy_verify("again")  # cached dummy hash


async def test_async_variants() -> None:
    stored = await pw.hash_password_async("async pw")
    assert await pw.verify_password_async("async pw", stored)
    assert not await pw.verify_password_async("nope", stored)
    await pw.dummy_verify_async("x")


# ---- tokens ---------------------------------------------------------------------------------

URLSAFE = set(string.ascii_letters + string.digits + "-_")


def test_tokens() -> None:
    token = new_token()
    assert len(token) == 43
    assert set(token) <= URLSAFE
    assert len(base64.urlsafe_b64decode(token + "=")) == 32
    assert new_token() != token
    digest = hash_token(token)
    assert len(digest) == 32
    assert tokens_equal(digest, hash_token(token))
    assert not tokens_equal(digest, hash_token(new_token()))
    assert tokens_equal("abc", b"abc")


def test_numeric_codes() -> None:
    codes = {new_numeric_code() for _ in range(200)}
    assert all(len(c) == 6 and c.isdigit() for c in codes)
    assert len(codes) > 150
    assert len(new_numeric_code(8)) == 8
    with pytest.raises(ValueError):
        new_numeric_code(3)


def test_code_hmac_depends_on_context() -> None:
    assert code_hmac("challenge-1", "123456") == code_hmac("challenge-1", "123456")
    assert code_hmac("challenge-1", "123456") != code_hmac("challenge-2", "123456")
    assert code_hmac("challenge-1", "123456") != code_hmac("challenge-1", "123457")
    assert len(code_hmac("c", "1")) == 32


def test_passwords_are_nfc_normalised() -> None:
    composed = "caf" + chr(0xE9) + " au lait tulip garden"  # é as one code point
    decomposed = "cafe" + chr(0x301) + " au lait tulip garden"  # e + combining acute
    assert composed != decomposed
    assert pw.normalize_password(decomposed) == composed
    assert pw.verify_password(decomposed, pw.hash_password(composed))
    assert pw.verify_password(composed, pw.hash_password(decomposed))


def test_full_width_password_is_not_folded() -> None:
    ascii_password = "tulip garden 2026"
    full_width = "".join(chr(ord(c) + 0xFEE0) if "!" <= c <= "~" else c for c in ascii_password)
    assert full_width != ascii_password
    assert not pw.verify_password(full_width, pw.hash_password(ascii_password))
