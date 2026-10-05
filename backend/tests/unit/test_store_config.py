import copy
import json
import uuid
from typing import Any

import pytest
from pydantic import ValidationError

from app.modules.storefront.store_config import StoreConfig
from app.seeds import SEEDS_DIR


@pytest.fixture
def document() -> dict[str, Any]:
    data: dict[str, Any] = json.loads(
        (SEEDS_DIR / "store_settings.json").read_text(encoding="utf-8-sig")
    )
    return data


def test_seed_file_validates(document: dict[str, Any]) -> None:
    config = StoreConfig.model_validate(document)
    assert [m.id for m in config.delivery_methods] == ["vadodara_local", "college", "parcel"]
    assert [m.fee_paise for m in config.delivery_methods] == [0, 0, 6000]
    assert config.method("parcel").free_from_subtotal_paise == 99900
    assert config.method("college").free_from_subtotal_paise is None
    assert config.gift_wrap_price_paise == 4000
    assert len(config.vadodara_areas) == 18
    assert [s.id for s in config.time_slots] == ["morning", "afternoon", "evening"]
    assert len(config.colleges) == 13
    assert config.allow_other_college
    assert config.store_open
    assert config.payment_methods.upi.vpa == "vidhiisingh2403@okicici"
    assert config.payment_methods.cod.enabled
    assert config.grievance_contact is None
    assert config.default_custom_request_seller_id is None
    with pytest.raises(KeyError):
        config.method("drone")  # type: ignore[arg-type]


def test_json_round_trip(document: dict[str, Any]) -> None:
    config = StoreConfig.model_validate(document)
    dumped = config.model_dump(mode="json")
    assert dumped == document
    assert StoreConfig.model_validate(json.loads(json.dumps(dumped))) == config
    seller = uuid.uuid7()
    with_seller = StoreConfig.model_validate(
        {**dumped, "default_custom_request_seller_id": str(seller)}
    )
    assert with_seller.model_dump(mode="json")["default_custom_request_seller_id"] == str(seller)


def _mutated(document: dict[str, Any], change: Any) -> dict[str, Any]:
    doc = copy.deepcopy(document)
    change(doc)
    return doc


REJECTIONS = {
    "missing method": lambda d: d["delivery_methods"].pop(),
    "duplicated method": lambda d: d["delivery_methods"].__setitem__(
        2, {**d["delivery_methods"][0]}
    ),
    "duplicate area ignoring case": lambda d: d["vadodara_areas"].append("ALKAPURI"),
    "duplicate slot id": lambda d: d["time_slots"].append({"id": "morning", "label": "Again"}),
    "duplicate college id": lambda d: d["colleges"].append(dict(d["colleges"][0])),
    "college id other": lambda d: d["colleges"][0].__setitem__("id", "other"),
    "upi without vpa": lambda d: d["payment_methods"]["upi"].__setitem__("vpa", None),
    "both payment methods off": lambda d: (
        d["payment_methods"]["upi"].__setitem__("enabled", False),
        d["payment_methods"]["cod"].__setitem__("enabled", False),
    ),
    "unknown key": lambda d: d.__setitem__("free_shipping", True),
    "unknown nested key": lambda d: d["delivery_methods"][0].__setitem__("colour", "pink"),
    "negative fee": lambda d: d["delivery_methods"][2].__setitem__("fee_paise", -1),
    "fee above cap": lambda d: d.__setitem__("gift_wrap_price_paise", 10_000_001),
    "zero free-from": lambda d: d["delivery_methods"][2].__setitem__("free_from_subtotal_paise", 0),
    "empty areas": lambda d: d.__setitem__("vadodara_areas", []),
    "bad slot slug": lambda d: d["time_slots"][0].__setitem__("id", "Morning Slot"),
    "bad vpa": lambda d: d["payment_methods"]["upi"].__setitem__("vpa", "no-at-sign"),
    "bad grievance phone": lambda d: d.__setitem__(
        "grievance_contact", {"name": "Owner", "email": "o@example.com", "phone": "12345"}
    ),
}


@pytest.mark.parametrize("case", sorted(REJECTIONS))
def test_rejections(document: dict[str, Any], case: str) -> None:
    with pytest.raises(ValidationError):
        StoreConfig.model_validate(_mutated(document, REJECTIONS[case]))


def test_grievance_contact_and_upi_disabled(document: dict[str, Any]) -> None:
    doc = _mutated(
        document,
        lambda d: (
            d.__setitem__(
                "grievance_contact",
                {"name": "Owner", "email": "owner@example.com", "phone": "+919876543210"},
            ),
            d["payment_methods"].__setitem__("upi", {"enabled": False}),
        ),
    )
    config = StoreConfig.model_validate(doc)
    assert config.grievance_contact is not None
    assert config.payment_methods.upi.vpa is None


def test_frozen(document: dict[str, Any]) -> None:
    config = StoreConfig.model_validate(document)
    with pytest.raises(ValidationError):
        config.store_open = False  # type: ignore[misc]
