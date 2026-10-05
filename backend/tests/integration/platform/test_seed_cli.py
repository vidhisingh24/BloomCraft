"""``bloomcraft seed`` through CliRunner; rows read via the migrator."""

import json
import shutil
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app import seeds
from app.core.config import Settings
from app.modules.storefront.store_config import StoreConfig
from tests.cli_helpers import as_system, invoke, query
from tests.factories import create_seller

pytestmark = pytest.mark.db


def counts(settings: Settings) -> tuple[int, int, int]:
    row = query(
        settings,
        "SELECT (SELECT count(*) FROM bloomcraft.categories), "
        "(SELECT count(*) FROM bloomcraft.store_settings), "
        "(SELECT count(*) FROM bloomcraft.coupons)",
    )[0]
    return int(row[0]), int(row[1]), int(row[2])


def seed_file(name: str) -> Any:
    return json.loads((seeds.SEEDS_DIR / name).read_text(encoding="utf-8-sig"))


def table(output: str) -> dict[str, tuple[int, ...]]:
    rows: dict[str, tuple[int, ...]] = {}
    for line in output.splitlines():
        parts = line.split()
        if parts and parts[0] in ("categories", "settings", "coupons") and len(parts) == 5:
            rows[parts[0]] = tuple(int(p) for p in parts[1:])
    return rows


def test_seed_all_is_idempotent_and_matches_the_files(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings
) -> None:
    first = invoke(monkeypatch, test_settings, "seed", "--all")
    assert first.exit_code == 0, first.output
    assert table(first.output) == {
        "categories": (3, 0, 0, 0),
        "settings": (1, 0, 0, 0),
        "coupons": (3, 0, 0, 0),
    }
    assert counts(test_settings) == (3, 1, 3)
    second = invoke(monkeypatch, test_settings, "seed", "--all")
    assert second.exit_code == 0, second.output
    assert table(second.output) == {
        "categories": (0, 0, 3, 0),
        "settings": (0, 0, 1, 0),
        "coupons": (0, 0, 3, 0),
    }
    assert counts(test_settings) == (3, 1, 3)

    categories = query(
        test_settings,
        "SELECT slug, name, sort_order, is_active FROM bloomcraft.categories ORDER BY sort_order",
    )
    assert [list(r) for r in categories] == [
        [c["slug"], c["name"], c["sort_order"], c["is_active"]]
        for c in seed_file("catalog.json")["categories"]
    ]
    fields = [
        "code",
        "type",
        "value",
        "min_order_paise",
        "max_discount_paise",
        "starts_at",
        "ends_at",
        "usage_limit_total",
        "usage_limit_per_user",
        "first_order_only",
        "is_active",
        "description",
    ]
    stored = query(test_settings, f"SELECT {', '.join(fields)} FROM bloomcraft.coupons")  # noqa: S608
    by_code = {row[0]: dict(zip(fields, row, strict=True)) for row in stored}
    for coupon in seed_file("coupons.json")["coupons"]:
        assert by_code[coupon["code"]] == coupon
    assert by_code["WELCOME50"]["first_order_only"] is True
    assert by_code["WELCOME50"]["usage_limit_per_user"] == 1
    config = query(test_settings, "SELECT config FROM bloomcraft.store_settings")[0][0]
    assert StoreConfig.model_validate(config) == StoreConfig.model_validate(
        seed_file("store_settings.json")
    )
    actions = query(test_settings, "SELECT action, metadata FROM bloomcraft.audit_log")
    assert [(a, m) for a, m in actions] == [
        ("seed.apply", {"kinds": ["categories", "settings", "coupons"], "created": 7, "updated": 0})
    ]


def test_differs_and_update(monkeypatch: pytest.MonkeyPatch, test_settings: Settings) -> None:
    async def make(session: AsyncSession) -> Any:
        seller = await create_seller(
            session, name="Maker", email="maker@example.test", slug="maker"
        )
        return seller.id

    seller_id = as_system(test_settings, make)
    first = invoke(monkeypatch, test_settings, "seed", "--all")
    assert first.exit_code == 0, first.output
    assert "default custom-request seller set to the only seller" in first.output
    query(
        test_settings,
        "UPDATE bloomcraft.coupons SET value = 20, times_redeemed = 5 WHERE code = 'BLOOM10'",
    )
    query(test_settings, "UPDATE bloomcraft.categories SET name = 'Charms' WHERE slug = 'keychain'")
    query(
        test_settings,
        "UPDATE bloomcraft.store_settings "
        "SET config = jsonb_set(config, '{gift_wrap_price_paise}', '5000')",
    )

    report = invoke(monkeypatch, test_settings, "seed", "--all")
    assert report.exit_code == 0, report.output
    assert "categories differ: keychain (use --update to overwrite)" in report.output
    assert "coupons differ: BLOOM10 (use --update to overwrite)" in report.output
    assert "settings differ: gift_wrap_price_paise (use --update to overwrite)" in report.output
    assert (
        query(test_settings, "SELECT value FROM bloomcraft.coupons WHERE code = 'BLOOM10'")[0][0]
        == 20
    )

    updated = invoke(monkeypatch, test_settings, "seed", "--all", "--update")
    assert updated.exit_code == 0, updated.output
    assert table(updated.output) == {
        "categories": (0, 1, 2, 0),
        "settings": (0, 1, 0, 0),
        "coupons": (0, 1, 2, 0),
    }
    coupon = query(
        test_settings,
        "SELECT value, times_redeemed FROM bloomcraft.coupons WHERE code = 'BLOOM10'",
    )[0]
    assert tuple(coupon) == (10, 5)  # times_redeemed survives
    name = query(test_settings, "SELECT name FROM bloomcraft.categories WHERE slug = 'keychain'")
    assert name[0][0] == "Keychains"
    config = query(test_settings, "SELECT config FROM bloomcraft.store_settings")[0][0]
    assert config["gift_wrap_price_paise"] == 4000
    assert config["default_custom_request_seller_id"] == str(seller_id)  # survives


def test_invalid_file_writes_nothing(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings, tmp_path: Path
) -> None:
    for name in ("catalog.json", "store_settings.json", "coupons.json"):
        shutil.copy(seeds.SEEDS_DIR / name, tmp_path / name)
    broken = seed_file("coupons.json")
    broken["coupons"][1]["code"] = "welcome50"
    (tmp_path / "coupons.json").write_text(json.dumps(broken), encoding="utf-8")
    monkeypatch.setattr(seeds, "SEEDS_DIR", tmp_path)
    result = invoke(monkeypatch, test_settings, "seed", "--all")
    assert result.exit_code == 2
    assert "invalid seed file: coupons.json: coupons.1.code: String should match pattern" in (
        result.output
    )
    assert "welcome50" not in result.output
    assert counts(test_settings) == (0, 0, 0)


def test_invalid_json_and_missing_kind(
    monkeypatch: pytest.MonkeyPatch, test_settings: Settings, tmp_path: Path
) -> None:
    (tmp_path / "catalog.json").write_text("{not json", encoding="utf-8")
    monkeypatch.setattr(seeds, "SEEDS_DIR", tmp_path)
    result = invoke(monkeypatch, test_settings, "seed", "--categories")
    assert result.exit_code == 2
    assert "invalid seed file: catalog.json: (root): invalid JSON" in result.output
    missing = invoke(monkeypatch, test_settings, "seed", "--coupons")
    assert missing.exit_code == 2
    assert "coupons.json: (root): file not found" in missing.output
    nothing = invoke(monkeypatch, test_settings, "seed")
    assert nothing.exit_code == 2
    assert "choose at least one of" in nothing.output
