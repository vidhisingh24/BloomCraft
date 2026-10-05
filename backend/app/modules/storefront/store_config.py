"""The ``store_settings.config`` document. Stored with ``model_dump(mode="json")`` (snake_case);
ordered collections are lists, because JSONB doesn't keep object-key order."""

import uuid
from typing import Annotated, Literal, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

MAX_PAISE = 10_000_000
SLUG_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"

DeliveryMethodId = Literal["vadodara_local", "college", "parcel"]
DELIVERY_METHOD_IDS: tuple[DeliveryMethodId, ...] = ("vadodara_local", "college", "parcel")


Text40 = Annotated[str, StringConstraints(min_length=1, max_length=40)]
Text80 = Annotated[str, StringConstraints(min_length=1, max_length=80)]
Text160 = Annotated[str, StringConstraints(min_length=1, max_length=160)]
Slug = Annotated[str, StringConstraints(pattern=SLUG_PATTERN, max_length=40)]
Paise = Annotated[int, Field(ge=0, le=MAX_PAISE)]
PositivePaise = Annotated[int, Field(gt=0, le=MAX_PAISE)]


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class DeliveryMethod(_Model):
    id: DeliveryMethodId
    enabled: bool = True
    name: Text80
    tagline: Text160
    badge: Text40
    fee_paise: Paise
    free_from_subtotal_paise: PositivePaise | None = None
    """The fee is waived when that order's subtotal is at least this."""
    estimated_days: Text80


class TimeSlot(_Model):
    id: Slug
    label: Text80


class College(_Model):
    id: Slug
    name: Text160
    campus_area: Text80
    handover_point: Text80

    @field_validator("id")
    @classmethod
    def _not_other(cls, value: str) -> str:
        if value == "other":
            raise ValueError("'other' is reserved for the checkout's 'Other / Not Listed' choice")
        return value


class UpiMethod(_Model):
    enabled: bool
    vpa: (
        Annotated[
            str, StringConstraints(pattern=r"^[A-Za-z0-9._-]{2,64}@[A-Za-z][A-Za-z0-9.-]{1,63}$")
        ]
        | None
    ) = None
    payee_name: Text80 | None = None

    @model_validator(mode="after")
    def _enabled_needs_details(self) -> Self:
        if self.enabled and (self.vpa is None or self.payee_name is None):
            raise ValueError("UPI needs a vpa and a payee_name when enabled")
        return self


class CodMethod(_Model):
    enabled: bool


class PaymentMethods(_Model):
    """Keys match ``orders.payment_method``."""

    upi: UpiMethod
    cod: CodMethod

    @model_validator(mode="after")
    def _one_enabled(self) -> Self:
        if not (self.upi.enabled or self.cod.enabled):
            raise ValueError("at least one payment method must be enabled")
        return self


class GrievanceContact(_Model):
    name: Text80
    email: EmailStr
    phone: Annotated[str, StringConstraints(pattern=r"^\+91[6-9]\d{9}$")] | None = None


class StoreConfig(_Model):
    store_open: bool = True
    closed_message: Text160 | None = None
    delivery_methods: list[DeliveryMethod]
    vadodara_areas: Annotated[list[Text80], Field(min_length=1, max_length=100)]
    time_slots: Annotated[list[TimeSlot], Field(min_length=1, max_length=12)]
    colleges: Annotated[list[College], Field(max_length=100)]
    allow_other_college: bool = True
    """The checkout's "Other / Not Listed" choice, where the customer types the college."""
    gift_wrap_price_paise: Paise
    payment_methods: PaymentMethods
    grievance_contact: GrievanceContact | None = None
    default_custom_request_seller_id: uuid.UUID | None = None

    @field_validator("delivery_methods")
    @classmethod
    def _one_of_each_method(cls, methods: list[DeliveryMethod]) -> list[DeliveryMethod]:
        ids = [method.id for method in methods]
        if sorted(ids) != sorted(DELIVERY_METHOD_IDS):
            raise ValueError("exactly one each of vadodara_local, college and parcel")
        return methods

    @field_validator("vadodara_areas")
    @classmethod
    def _unique_areas(cls, areas: list[str]) -> list[str]:
        if len({area.casefold() for area in areas}) != len(areas):
            raise ValueError("areas must be unique (ignoring case)")
        return areas

    @field_validator("time_slots")
    @classmethod
    def _unique_slots(cls, slots: list[TimeSlot]) -> list[TimeSlot]:
        if len({slot.id for slot in slots}) != len(slots):
            raise ValueError("time slot ids must be unique")
        return slots

    @field_validator("colleges")
    @classmethod
    def _unique_colleges(cls, colleges: list[College]) -> list[College]:
        if len({college.id for college in colleges}) != len(colleges):
            raise ValueError("college ids must be unique")
        return colleges

    def method(self, method_id: DeliveryMethodId) -> DeliveryMethod:
        for candidate in self.delivery_methods:
            if candidate.id == method_id:
                return candidate
        raise KeyError(method_id)
