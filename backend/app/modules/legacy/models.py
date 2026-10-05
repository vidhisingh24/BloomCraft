"""Pre-login customers and their import batches (PLAN §1.10)."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    LargeBinary,
    Text,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAt, Timestamps, UUIDPrimaryKey
from app.db.types import encrypted_text


class LegacyImportBatch(UUIDPrimaryKey, CreatedAt, Base):
    __tablename__ = "legacy_import_batches"
    __table_args__ = (CheckConstraint("octet_length(file_sha256) = 32", name="file_sha256_length"),)

    file_sha256: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    operator: Mapped[str] = mapped_column(Text, nullable=False)
    dry_run: Mapped[bool] = mapped_column(Boolean, nullable=False)
    stats: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )


class LegacyCustomer(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "legacy_customers"
    __table_args__ = (
        CheckConstraint("(email IS NULL) = (email_bidx IS NULL)", name="email_bidx_pair"),
        CheckConstraint("(phone IS NULL) = (phone_bidx IS NULL)", name="phone_bidx_pair"),
        CheckConstraint("(claimed_by_user_id IS NULL) = (claimed_at IS NULL)", name="claim_pair"),
        Index("ix_legacy_customers_import_batch_id", "import_batch_id"),
        Index("ix_legacy_customers_claimed_by_user_id", "claimed_by_user_id"),
    )

    legacy_ref: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    email_ct: Mapped[bytes | None] = mapped_column("email", LargeBinary)
    email_bidx: Mapped[bytes | None] = mapped_column(LargeBinary, unique=True)
    phone_ct: Mapped[bytes | None] = mapped_column("phone", LargeBinary)
    phone_bidx: Mapped[bytes | None] = mapped_column(LargeBinary, unique=True)
    city: Mapped[str | None] = mapped_column(Text)
    notes_ct: Mapped[bytes | None] = mapped_column("notes", LargeBinary)
    import_batch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("bloomcraft.legacy_import_batches.id", ondelete="RESTRICT"), nullable=False
    )
    claimed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("bloomcraft.users.id", ondelete="RESTRICT")
    )
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    email = encrypted_text("email_ct", bidx=("email_bidx", "email"))
    phone = encrypted_text("phone_ct", bidx=("phone_bidx", "phone"))
    notes = encrypted_text("notes_ct")
