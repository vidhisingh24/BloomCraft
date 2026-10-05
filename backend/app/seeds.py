"""Base seeds from ``backend/seeds/*.json``: categories, store settings, coupons.

Every requested file is validated before any database work. Rows are matched by natural key
(category slug, coupon code, settings id 1): missing → created; equal → unchanged; different →
kept and reported as "differs", unless ``update=True`` makes them match the file. Rows not in
the files are never touched, and ``coupons.times_redeemed`` and the store's
``default_custom_request_seller_id`` are never overwritten.
"""

import json
import uuid
from collections.abc import Iterable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Annotated, Any, Literal, Self, get_args

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    ValidationError,
    field_validator,
    model_validator,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import BACKEND_DIR
from app.modules.audit.writer import record_audit
from app.modules.catalog.models import Category
from app.modules.checkout.models import Coupon
from app.modules.storefront.models import StoreSettings
from app.modules.storefront.service import SETTINGS_ID, ensure_default_custom_request_seller
from app.modules.storefront.store_config import SLUG_PATTERN, StoreConfig

SEEDS_DIR = BACKEND_DIR / "seeds"

SeedKind = Literal["categories", "settings", "coupons"]
SEED_KINDS: tuple[SeedKind, ...] = get_args(SeedKind)
SEED_FILES: dict[SeedKind, str] = {
    "categories": "catalog.json",
    "settings": "store_settings.json",
    "coupons": "coupons.json",
}


class SeedFileError(ValueError):
    """``<file>: <field path>: <message>`` — never the input value."""


class _Seed(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class CategorySeed(_Seed):
    slug: Annotated[str, StringConstraints(pattern=SLUG_PATTERN, max_length=40)]
    name: Annotated[str, StringConstraints(min_length=1, max_length=80)]
    sort_order: int
    is_active: bool


class CatalogFile(_Seed):
    categories: list[CategorySeed]

    @field_validator("categories")
    @classmethod
    def _unique(cls, categories: list[CategorySeed]) -> list[CategorySeed]:
        if len({c.slug for c in categories}) != len(categories):
            raise ValueError("category slugs must be unique")
        return categories


class CouponSeed(_Seed):
    code: Annotated[str, StringConstraints(pattern=r"^[A-Z0-9]{3,32}$")]
    type: Literal["percentage", "flat"]
    value: Annotated[int, Field(gt=0)]
    min_order_paise: Annotated[int, Field(ge=0)]
    max_discount_paise: Annotated[int, Field(ge=0)] | None
    starts_at: AwareDatetime | None
    ends_at: AwareDatetime | None
    usage_limit_total: Annotated[int, Field(gt=0)] | None
    usage_limit_per_user: Annotated[int, Field(gt=0)] | None
    first_order_only: bool
    is_active: bool
    description: Annotated[str, StringConstraints(min_length=1, max_length=200)] | None

    @model_validator(mode="after")
    def _rules(self) -> Self:
        if self.type == "percentage" and self.value > 100:
            raise ValueError("a percentage coupon's value must be at most 100")
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        return self


class CouponsFile(_Seed):
    coupons: list[CouponSeed]

    @field_validator("coupons")
    @classmethod
    def _unique(cls, coupons: list[CouponSeed]) -> list[CouponSeed]:
        if len({c.code for c in coupons}) != len(coupons):
            raise ValueError("coupon codes must be unique")
        return coupons


COUPON_FIELDS = (
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
)
CATEGORY_FIELDS = ("name", "sort_order", "is_active")


@dataclass(frozen=True, slots=True)
class LoadedSeeds:
    categories: list[CategorySeed] | None = None
    settings: StoreConfig | None = None
    coupons: list[CouponSeed] | None = None

    @property
    def kinds(self) -> list[SeedKind]:
        return [kind for kind in SEED_KINDS if getattr(self, kind) is not None]


@dataclass
class KindReport:
    created: int = 0
    updated: int = 0
    unchanged: int = 0
    differs: list[str] = field(default_factory=list)


@dataclass
class SeedReport:
    kinds: dict[SeedKind, KindReport] = field(default_factory=dict)
    default_seller_set: bool = False

    @property
    def written(self) -> int:
        return sum(r.created + r.updated for r in self.kinds.values())


def _error_message(file_name: str, exc: ValidationError) -> str:
    first = exc.errors(include_url=False, include_input=False)[0]
    path = ".".join(str(part) for part in first["loc"]) or "(root)"
    return f"{file_name}: {path}: {first['msg']}"


def _read(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except FileNotFoundError:
        raise SeedFileError(f"{path.name}: (root): file not found") from None
    except json.JSONDecodeError as exc:
        raise SeedFileError(
            f"{path.name}: (root): invalid JSON (line {exc.lineno}, column {exc.colno})"
        ) from None


def load_seed_files(kinds: Iterable[SeedKind], seeds_dir: Path | None = None) -> LoadedSeeds:
    """Validate every requested file; ``SeedFileError`` names the file and field."""
    directory = seeds_dir if seeds_dir is not None else SEEDS_DIR
    values: dict[str, Any] = {}
    for kind in dict.fromkeys(kinds):
        file_name = SEED_FILES[kind]
        document = _read(directory / file_name)
        try:
            if kind == "categories":
                values[kind] = CatalogFile.model_validate(document).categories
            elif kind == "coupons":
                values[kind] = CouponsFile.model_validate(document).coupons
            else:
                values[kind] = StoreConfig.model_validate(document)
        except ValidationError as exc:
            raise SeedFileError(_error_message(file_name, exc)) from None
    return LoadedSeeds(**values)


def _differs(row: Any, seed: _Seed, fields: tuple[str, ...]) -> bool:
    return any(getattr(row, name) != getattr(seed, name) for name in fields)


def _assign(row: Any, seed: _Seed, fields: tuple[str, ...]) -> None:
    for name in fields:
        setattr(row, name, getattr(seed, name))


async def _apply_categories(
    session: AsyncSession, seeds: list[CategorySeed], update: bool
) -> KindReport:
    report = KindReport()
    for seed in seeds:
        row = (
            await session.execute(select(Category).where(Category.slug == seed.slug))
        ).scalar_one_or_none()
        if row is None:
            session.add(Category(slug=seed.slug, **{f: getattr(seed, f) for f in CATEGORY_FIELDS}))
            report.created += 1
        elif not _differs(row, seed, CATEGORY_FIELDS):
            report.unchanged += 1
        elif update:
            _assign(row, seed, CATEGORY_FIELDS)
            report.updated += 1
        else:
            report.differs.append(seed.slug)
    await session.flush()
    return report


async def _apply_coupons(
    session: AsyncSession, seeds: list[CouponSeed], update: bool
) -> KindReport:
    report = KindReport()
    for seed in seeds:
        row = (
            await session.execute(select(Coupon).where(Coupon.code == seed.code))
        ).scalar_one_or_none()
        if row is None:
            session.add(Coupon(code=seed.code, **{f: getattr(seed, f) for f in COUPON_FIELDS}))
            report.created += 1
        elif not _differs(row, seed, COUPON_FIELDS):
            report.unchanged += 1
        elif update:
            _assign(row, seed, COUPON_FIELDS)  # never times_redeemed
            report.updated += 1
        else:
            report.differs.append(seed.code)
    await session.flush()
    return report


def _stored_default_seller(raw: Any) -> uuid.UUID | None:
    """The default seller of a stored config that no longer validates (carried over as is)."""
    value = raw.get("default_custom_request_seller_id") if isinstance(raw, dict) else None
    if value is None:
        return None
    try:
        return uuid.UUID(str(value))
    except ValueError:
        return None


async def _apply_settings(session: AsyncSession, seed: StoreConfig, update: bool) -> KindReport:
    report = KindReport()
    row = await session.get(StoreSettings, SETTINGS_ID)
    if row is None:
        session.add(StoreSettings(id=SETTINGS_ID, config=seed.model_dump(mode="json")))
        report.created += 1
        await session.flush()
        return report
    try:
        stored: StoreConfig | None = StoreConfig.model_validate(row.config)
    except ValidationError:
        stored = None
    carried = (
        stored.default_custom_request_seller_id
        if stored is not None
        else _stored_default_seller(row.config)
    )
    desired = StoreConfig.model_validate(
        {**seed.model_dump(mode="json"), "default_custom_request_seller_id": carried}
    )
    if stored == desired:
        report.unchanged += 1
    elif update:
        row.config = desired.model_dump(mode="json")
        report.updated += 1
    elif stored is None:
        report.differs.append("(stored config fails validation)")
    else:
        stored_json, desired_json = stored.model_dump(mode="json"), desired.model_dump(mode="json")
        report.differs.extend(k for k in desired_json if stored_json.get(k) != desired_json[k])
    await session.flush()
    return report


async def apply_seeds(session: AsyncSession, loaded: LoadedSeeds, *, update: bool) -> SeedReport:
    """Apply the loaded seeds in the caller's transaction (under ``system_context``)."""
    report = SeedReport()
    if loaded.categories is not None:
        report.kinds["categories"] = await _apply_categories(session, loaded.categories, update)
    if loaded.settings is not None:
        report.kinds["settings"] = await _apply_settings(session, loaded.settings, update)
        report.default_seller_set = await ensure_default_custom_request_seller(session) is not None
    if loaded.coupons is not None:
        report.kinds["coupons"] = await _apply_coupons(session, loaded.coupons, update)
    if report.written:
        await record_audit(
            session,
            action="seed.apply",
            actor_role="system",
            metadata={
                "kinds": list(report.kinds),
                "created": sum(r.created for r in report.kinds.values()),
                "updated": sum(r.updated for r in report.kinds.values()),
            },
        )
    return report
