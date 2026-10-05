"""Injectable clock: UTC-aware ``now()`` plus Asia/Kolkata calendar helpers (A3, A36)."""

from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


class Clock:
    """Real time. Tests freeze it with time-machine or substitute a subclass."""

    def now(self) -> datetime:
        return datetime.now(UTC)

    def today_ist(self) -> date:
        return self.now().astimezone(IST).date()


def to_ist(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("naive datetime")
    return value.astimezone(IST)


_default_clock = Clock()


def get_clock() -> Clock:
    """FastAPI dependency (override in tests via ``app.dependency_overrides``)."""
    return _default_clock
