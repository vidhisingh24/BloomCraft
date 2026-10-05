"""Base models (camelCase on the wire) and the canonical date/time wire formats (PLAN A3, A6)."""

from datetime import UTC, date, datetime
from typing import Annotated

from pydantic import AfterValidator, AwareDatetime, BaseModel, ConfigDict, PlainSerializer
from pydantic.alias_generators import to_camel


class RequestModel(BaseModel):
    """Inbound bodies: camelCase keys only; snake_case or unknown keys are rejected."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_alias=True,
        validate_by_name=False,
        extra="forbid",
    )


class ResponseModel(BaseModel):
    """Outbound bodies: built from snake_case attributes, serialised as camelCase."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
    )


def _to_utc(value: datetime) -> datetime:
    return value.astimezone(UTC)


def format_utc(value: datetime) -> str:
    """``YYYY-MM-DDTHH:MM:SS.mmmZ`` (RFC 3339, UTC, millisecond precision)."""
    if value.tzinfo is None:
        raise ValueError("naive datetime")
    utc = value.astimezone(UTC)
    return utc.strftime("%Y-%m-%dT%H:%M:%S.") + f"{utc.microsecond // 1000:03d}Z"


def format_date(value: date) -> str:
    return value.isoformat()


UtcDateTime = Annotated[
    AwareDatetime,
    AfterValidator(_to_utc),
    PlainSerializer(format_utc, return_type=str, when_used="always"),
]
"""Timezone-aware input (naive is rejected), normalised to UTC, emitted with a ``Z``."""

IsoDate = Annotated[date, PlainSerializer(format_date, return_type=str, when_used="always")]
"""Calendar date as ``YYYY-MM-DD`` (interpreted in Asia/Kolkata by the business rules)."""
