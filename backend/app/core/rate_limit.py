"""Rate-limit buckets (the limiter itself arrives in Phase 5).

UNLOGGED: counters needn't survive a crash. Keys use blind indexes / IP HMACs, never raw values.
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, PrimaryKeyConstraint, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RateLimitBucket(Base):
    __tablename__ = "rate_limit_buckets"
    __table_args__ = (
        PrimaryKeyConstraint("key", "window_start"),
        CheckConstraint("count >= 0", name="count"),
        Index("ix_rate_limit_buckets_window_start", "window_start"),
        {"prefixes": ["UNLOGGED"]},
    )

    key: Mapped[str] = mapped_column(Text, nullable=False)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
