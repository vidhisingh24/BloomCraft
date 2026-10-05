"""AES-256-GCM field encryption bound to its table, column and row.

Blob layout::

    0x01 (format) | key-id length (1 byte) | key id (ASCII) | nonce (12 bytes) | ciphertext+tag

AAD = ``"{table}|{column}|{row_id}"`` (table without schema, lowercase canonical UUID), so a
ciphertext copied into another row, column or table does not decrypt. Errors never contain
plaintext or key bytes.
"""

import json
import os
import uuid
from typing import Any

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import KEY_ID_RE, FieldKeyring
from app.crypto.keyring import field_keyring

FORMAT_VERSION = 0x01
NONCE_BYTES = 12
TAG_BYTES = 16


class DecryptionError(Exception):
    """Wrong row/column/table, unknown key, tampered or malformed blob."""


def associated_data(table: str, column: str, row_id: uuid.UUID) -> bytes:
    return f"{table}|{column}|{row_id}".encode("ascii")


def _parse(blob: bytes) -> tuple[str, bytes, bytes]:
    if not isinstance(blob, bytes | bytearray | memoryview):
        raise DecryptionError("ciphertext must be bytes")
    data = bytes(blob)
    if len(data) < 2 or data[0] != FORMAT_VERSION:
        raise DecryptionError("unsupported ciphertext format")
    kid_len = data[1]
    header = 2 + kid_len
    if kid_len == 0 or len(data) < header + NONCE_BYTES + TAG_BYTES:
        raise DecryptionError("truncated ciphertext")
    try:
        key_id = data[2:header].decode("ascii")
    except UnicodeDecodeError:
        raise DecryptionError("malformed key id") from None
    if not KEY_ID_RE.fullmatch(key_id):
        raise DecryptionError("malformed key id")
    return key_id, data[header : header + NONCE_BYTES], data[header + NONCE_BYTES :]


def key_id_of(blob: bytes) -> str:
    return _parse(blob)[0]


def encrypt_bytes(
    plaintext: bytes,
    *,
    table: str,
    column: str,
    row_id: uuid.UUID,
    keyring: FieldKeyring | None = None,
    key_id: str | None = None,
) -> bytes:
    """Encrypt with the keyring's active key (or ``key_id``)."""
    ring = keyring if keyring is not None else field_keyring()
    kid = key_id if key_id is not None else ring.active
    key = ring.keys.get(kid)
    if key is None:
        raise DecryptionError(f"key id {kid!r} is not in the keyring")
    nonce = os.urandom(NONCE_BYTES)
    ciphertext = AESGCM(key.get_secret_value()).encrypt(
        nonce, plaintext, associated_data(table, column, row_id)
    )
    kid_bytes = kid.encode("ascii")
    return bytes([FORMAT_VERSION, len(kid_bytes)]) + kid_bytes + nonce + ciphertext


def decrypt_bytes(
    blob: bytes,
    *,
    table: str,
    column: str,
    row_id: uuid.UUID,
    keyring: FieldKeyring | None = None,
) -> bytes:
    """Decrypt with the key the blob names."""
    kid, nonce, ciphertext = _parse(blob)
    ring = keyring if keyring is not None else field_keyring()
    key = ring.keys.get(kid)
    if key is None:
        raise DecryptionError(f"key id {kid!r} is not in the keyring")
    try:
        return AESGCM(key.get_secret_value()).decrypt(
            nonce, ciphertext, associated_data(table, column, row_id)
        )
    except InvalidTag:
        raise DecryptionError(
            f"cannot decrypt {table}.{column} (wrong row, column or key, or tampered data)"
        ) from None


def reencrypt(
    blob: bytes,
    *,
    table: str,
    column: str,
    row_id: uuid.UUID,
    to_key_id: str,
    keyring: FieldKeyring | None = None,
) -> bytes:
    """Same AAD, new key."""
    plaintext = decrypt_bytes(blob, table=table, column=column, row_id=row_id, keyring=keyring)
    return encrypt_bytes(
        plaintext, table=table, column=column, row_id=row_id, keyring=keyring, key_id=to_key_id
    )


def encrypt_text(value: str, *, table: str, column: str, row_id: uuid.UUID) -> bytes:
    return encrypt_bytes(value.encode("utf-8"), table=table, column=column, row_id=row_id)


def decrypt_text(blob: bytes, *, table: str, column: str, row_id: uuid.UUID) -> str:
    return decrypt_bytes(blob, table=table, column=column, row_id=row_id).decode("utf-8")


def dump_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )


def encrypt_json(value: Any, *, table: str, column: str, row_id: uuid.UUID) -> bytes:
    return encrypt_bytes(dump_json(value), table=table, column=column, row_id=row_id)


def decrypt_json(blob: bytes, *, table: str, column: str, row_id: uuid.UUID) -> Any:
    return json.loads(decrypt_bytes(blob, table=table, column=column, row_id=row_id))
