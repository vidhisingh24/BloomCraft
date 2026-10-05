"""Append an audit row (Core insert, no RETURNING, no primary-key prefetch). Never commits.

Metadata is for identifiers and counts only — never personal data or secrets; the guard
rejects anything that looks otherwise (a programming error, not user input).
"""

import uuid
from collections.abc import Mapping
from typing import Any, cast

from sqlalchemy import Table, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.request_context import get_request_id
from app.crypto.blind_index import blind_index
from app.modules.audit.models import AuditLog

AUDIT_TABLE = cast(Table, AuditLog.__table__)
MAX_METADATA_KEYS = 20
MAX_STRING_LENGTH = 200
FORBIDDEN_KEY_PARTS = (
    "email",
    "phone",
    "password",
    "secret",
    "token",
    "otp",
    "address",
    "full_name",
    "contact",
)
Scalar = str | int | bool | None


class AuditMetadataError(ValueError):
    """Audit metadata broke the rules (a programming error)."""


def _check_scalar(key: str, value: Any) -> None:
    if value is not None and not isinstance(value, str | int | bool):
        raise AuditMetadataError(f"audit metadata {key!r}: unsupported value type")
    if isinstance(value, str) and len(value) > MAX_STRING_LENGTH:
        raise AuditMetadataError(f"audit metadata {key!r}: string longer than {MAX_STRING_LENGTH}")


def validate_metadata(metadata: Mapping[str, Any] | None) -> dict[str, Any]:
    if metadata is None:
        return {}
    if len(metadata) > MAX_METADATA_KEYS:
        raise AuditMetadataError(f"audit metadata: more than {MAX_METADATA_KEYS} keys")
    for key, value in metadata.items():
        if not isinstance(key, str):
            raise AuditMetadataError("audit metadata keys must be strings")
        lowered = key.lower()
        if any(part in lowered for part in FORBIDDEN_KEY_PARTS):
            raise AuditMetadataError(f"audit metadata {key!r}: personal data or secrets")
        if isinstance(value, list):
            for item in value:
                _check_scalar(key, item)
        else:
            _check_scalar(key, value)
    return dict(metadata)


async def record_audit(
    session: AsyncSession,
    *,
    action: str,
    outcome: str = "success",
    actor_user_id: uuid.UUID | None = None,
    actor_role: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    metadata: Mapping[str, Any] | None = None,
    ip: str | None = None,
) -> None:
    request_id = get_request_id()
    await session.execute(
        insert(AUDIT_TABLE)
        .inline()
        .values(
            action=action,
            outcome=outcome,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            target_type=target_type,
            target_id=target_id,
            metadata=validate_metadata(metadata),
            ip_hmac=blind_index("ip", ip) if ip is not None else None,
            request_id=uuid.UUID(request_id) if request_id else None,
        )
    )
