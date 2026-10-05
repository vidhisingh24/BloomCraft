"""Row-level security, grants, guard triggers and actor-context hygiene, as bloomcraft_app.

One world (tests/factories.py::build_world) is built per module: customers C1, C2; approved
sellers S1, S2; pending seller S3; seller S4 with a suspended grant; admin A. Every probe runs in
a transaction that is rolled back.
"""

import contextlib
import re
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from sqlalchemy import delete, func, insert, select, text, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.auth.models import UserRole
from app.core.actor import Actor
from app.core.config import BACKEND_DIR, Settings
from app.db.actor import ActorContextError, current_db_actor, set_actor, system_context
from app.db.base import WriteOnlyTableError, column_values
from app.db.registry import metadata
from app.db.session import create_engine, create_sessionmaker, transaction
from app.modules.audit.models import AuditLog
from app.modules.notifications.models import Notification
from app.modules.orders.models import Order, OrderItem
from tests.conftest import truncate_bloomcraft_tables
from tests.factories import World, build_world, insert_audit, insert_notification

pytestmark = pytest.mark.db_module

ACTORS = ("none", "C1", "S1", "A", "system")
ROLE_OF = {"C1": "customer", "S1": "seller", "A": "admin"}


def table(name: str) -> Any:
    return metadata.tables[f"bloomcraft.{name}"]


ORDERS = table("orders")


@pytest.fixture(scope="module")
async def world(
    app_sessionmaker: async_sessionmaker[AsyncSession], migrator_engine: AsyncEngine
) -> AsyncIterator[World]:
    await truncate_bloomcraft_tables(migrator_engine)
    async with transaction(app_sessionmaker) as session:
        await set_actor(session, None)
        async with system_context(session, "tests: build the RLS world"):
            built = await build_world(session)
    yield built
    await truncate_bloomcraft_tables(migrator_engine)


@contextlib.asynccontextmanager
async def acting(
    factory: async_sessionmaker[AsyncSession], world: World, who: str
) -> AsyncIterator[AsyncSession]:
    """A transaction as ``who`` (none / C1 / S1 / A / system) that is always rolled back."""
    session = factory()
    await session.begin()
    try:
        if who == "system":
            await set_actor(session, None)
            async with system_context(session, "tests: act as system"):
                yield session
        else:
            actor = None if who == "none" else Actor(world.ids[who], ROLE_OF[who])  # type: ignore[arg-type]
            await set_actor(session, actor)
            yield session
    finally:
        await session.rollback()
        await session.close()


def sqlstate(exc: DBAPIError) -> str | None:
    code = getattr(exc.orig, "pgcode", None) or getattr(exc.orig, "sqlstate", None)
    cause = exc.orig.__cause__ if exc.orig is not None else None
    return code or getattr(cause, "sqlstate", None)


@contextlib.contextmanager
def denied(message: str, code: str = "42501") -> Any:
    with pytest.raises(DBAPIError) as exc:
        yield exc
    assert sqlstate(exc.value) == code, str(exc.value)
    assert re.search(message, str(exc.value)), str(exc.value)


# ---- read matrix ----------------------------------------------------------------------------

# Visible row counts per actor (none, C1, S1 as seller, A as admin, system), written from the
# world's contents — not derived from the policies.
EXPECTED_VISIBLE: dict[str, tuple[int, int, int, int, int]] = {
    "users": (0, 1, 1, 7, 7),
    "user_roles": (0, 1, 2, 12, 12),
    "seller_profiles": (0, 0, 1, 4, 4),
    "oauth_identities": (0, 1, 1, 2, 2),
    "sessions": (0, 1, 1, 1, 3),
    "addresses": (0, 1, 1, 3, 3),
    "admin_invitations": (0, 0, 0, 1, 1),
    "blocked_identifiers": (0, 0, 0, 1, 1),
    "oauth_transactions": (0, 0, 0, 0, 1),
    "pending_signups": (0, 0, 0, 0, 1),
    "verification_challenges": (0, 0, 0, 0, 1),
    "one_time_tokens": (0, 0, 0, 0, 1),
    "mfa_recovery_codes": (0, 0, 0, 0, 1),
    "rate_limit_buckets": (0, 0, 0, 0, 1),
    "wishlist_items": (0, 1, 1, 0, 3),
    "cart_items": (0, 1, 1, 0, 3),
    "coupon_redemptions": (0, 1, 0, 2, 2),
    "orders": (0, 2, 2, 4, 4),
    "order_items": (0, 2, 2, 4, 4),
    "order_status_events": (0, 2, 4, 8, 8),
    "idempotency_records": (0, 1, 0, 0, 2),
    "custom_requests": (0, 1, 1, 2, 2),
    "custom_request_images": (0, 1, 1, 2, 2),
    "notifications": (0, 0, 0, 2, 2),
    "legacy_import_batches": (0, 0, 0, 1, 1),
    "legacy_customers": (0, 0, 0, 1, 1),
    "store_settings": (1, 1, 1, 1, 1),
    "audit_log": (0, 0, 0, 2, 2),
}


@pytest.mark.parametrize("table_name", sorted(EXPECTED_VISIBLE))
async def test_read_matrix(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession], table_name: str
) -> None:
    seen = []
    for who in ACTORS:
        async with acting(app_sessionmaker, world, who) as s:
            seen.append(
                (await s.execute(select(func.count()).select_from(table(table_name)))).scalar_one()
            )
    assert tuple(seen) == EXPECTED_VISIBLE[table_name], dict(zip(ACTORS, seen, strict=True))


async def test_customer_sees_only_own_orders(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "C1") as s:
        ids = set((await s.execute(select(ORDERS.c.id))).scalars())
    assert ids == {world.orders["O1"], world.orders["O2"]}
    async with acting(app_sessionmaker, world, "S1") as s:
        ids = set((await s.execute(select(ORDERS.c.id))).scalars())
    assert ids == {world.orders["O1"], world.orders["OL"]}


# ---- write probes ---------------------------------------------------------------------------


async def _update_order(s: AsyncSession, order_id: uuid.UUID, **values: Any) -> int:
    result = await s.execute(update(ORDERS).where(ORDERS.c.id == order_id).values(**values))
    return int(result.rowcount)  # type: ignore[attr-defined]


async def test_customer_cannot_update_someone_elses_order(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "C1") as s:
        assert await _update_order(s, world.orders["O3"], gift_wrap_requested=False) == 0


async def test_seller_cannot_update_another_sellers_order(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "S1") as s:
        assert await _update_order(s, world.orders["O2"], status="confirmed") == 0


@pytest.mark.parametrize(
    ("who", "order", "column", "target"),
    [
        ("S1", "O1", "seller_id", "S2"),  # seller moving an order to another seller
        ("S1", "O1", "customer_id", "C2"),  # seller re-pointing the customer
        ("C1", "O1", "seller_id", "S2"),  # customer re-pointing the seller
        ("A", "O1", "customer_id", "C2"),  # admin on a web order
    ],
)
async def test_order_ownership_guard(
    world: World,
    app_sessionmaker: async_sessionmaker[AsyncSession],
    who: str,
    order: str,
    column: str,
    target: str,
) -> None:
    async with acting(app_sessionmaker, world, who) as s:
        with denied(rf"orders\.{column} cannot be changed by role {ROLE_OF[who]}"):
            await _update_order(s, world.orders[order], **{column: world.ids[target]})


async def test_order_money_columns_are_guarded(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "A") as s:
        with denied(r"orders\.subtotal_paise cannot be changed"):
            await _update_order(s, world.orders["O1"], subtotal_paise=1000, total_paise=5000)


async def test_allowed_order_updates(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "A") as s:  # legacy re-assignment (§1.10)
        assert await _update_order(s, world.orders["OL"], customer_id=world.ids["C1"]) == 1
        assert await _update_order(s, world.orders["O3"], status="preparing") == 1
    async with acting(app_sessionmaker, world, "S1") as s:
        assert await _update_order(s, world.orders["O1"], status="confirmed") == 1
    async with acting(app_sessionmaker, world, "C1") as s:
        assert (
            await _update_order(
                s, world.orders["O1"], status="cancelled", cancel_reason="customer_request"
            )
            == 1
        )
    async with acting(app_sessionmaker, world, "system") as s:
        assert await _update_order(s, world.orders["O1"], seller_id=world.ids["S2"]) == 1


async def test_custom_request_guards(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    requests = table("custom_requests")
    stmt = update(requests).where(requests.c.id == world.ids["CR1"])
    async with acting(app_sessionmaker, world, "S1") as s:
        with denied(r"custom_requests\.assigned_seller_id cannot be changed by role seller"):
            await s.execute(stmt.values(assigned_seller_id=world.ids["S2"]))
    async with acting(app_sessionmaker, world, "C1") as s:
        with denied(r"custom_requests\.customer_id cannot be changed by role customer"):
            await s.execute(stmt.values(customer_id=world.ids["C2"]))
    async with acting(app_sessionmaker, world, "A") as s:
        with denied(r"custom_requests\.customer_id cannot be changed by role admin"):
            await s.execute(stmt.values(customer_id=world.ids["C2"]))
    async with acting(app_sessionmaker, world, "A") as s:  # admins may re-assign the seller
        result = await s.execute(stmt.values(assigned_seller_id=world.ids["S2"]))
        assert result.rowcount == 1  # type: ignore[attr-defined]


async def test_product_seller_guard(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    products = table("products")
    stmt = update(products).where(products.c.id == world.ids["P1"])
    async with acting(app_sessionmaker, world, "A") as s:
        with denied(r"products\.seller_id cannot be changed by role admin"):
            await s.execute(stmt.values(seller_id=world.ids["S2"]))
    async with acting(app_sessionmaker, world, "A") as s:
        assert (await s.execute(stmt.values(name="Renamed"))).rowcount == 1  # type: ignore[attr-defined]


def _order_values(world: World, customer: str, seller: str) -> dict[str, Any]:
    order = Order(
        order_number="BC-2026-ABCDEF",
        checkout_id=uuid.uuid7(),
        customer_id=world.ids[customer],
        seller_id=world.ids[seller],
        source="web",
        delivery_method="vadodara_local",
        subtotal_paise=100,
        delivery_paise=0,
        gift_wrap_paise=0,
        discount_paise=0,
        total_paise=100,
        payment_method="cod",
        terms_version="2026-09",
    )
    order.delivery_details = {}
    order.contact_name = "x"
    order.contact_phone = "+919876543210"
    order.contact_email = "x@example.test"
    return column_values(order)


async def test_customer_cannot_insert_order_for_someone_else(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "C1") as s:
        with denied("new row violates row-level security policy"):
            await s.execute(insert(ORDERS).values(_order_values(world, "C2", "S1")))
    async with acting(app_sessionmaker, world, "C1") as s:
        await s.execute(insert(ORDERS).values(_order_values(world, "C1", "S1")))  # own: allowed


async def test_customer_cannot_add_items_to_someone_elses_order(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    def item(order: str) -> dict[str, Any]:
        return column_values(
            OrderItem(
                id=uuid.uuid7(),
                order_id=world.orders[order],
                sku="kc-x",
                name="x",
                unit_price_paise=100,
                quantity=1,
                line_total_paise=100,
            )
        )

    async with acting(app_sessionmaker, world, "C1") as s:
        with denied("new row violates row-level security policy"):
            await s.execute(insert(table("order_items")).values(item("O3")))
    async with acting(app_sessionmaker, world, "C1") as s:
        await s.execute(insert(table("order_items")).values(item("O1")))


async def test_role_self_grants(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    c1 = world.ids["C1"]
    async with acting(app_sessionmaker, world, "C1") as s:
        s.add(UserRole(user_id=c1, role="admin", status="active", granted_via="admin"))
        with denied("new row violates row-level security policy"):
            await s.flush()
    async with acting(app_sessionmaker, world, "C1") as s:
        s.add(UserRole(user_id=c1, role="seller", status="active", granted_via="application"))
        with denied("new row violates row-level security policy"):
            await s.flush()
    async with acting(app_sessionmaker, world, "C1") as s:  # applying as a seller is allowed
        s.add(UserRole(user_id=c1, role="seller", status="pending", granted_via="application"))
        await s.flush()


async def test_outbox_insert_rules(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    payload = {"k": "v"}
    async with acting(app_sessionmaker, world, "none") as s:
        with denied("new row violates row-level security policy"):
            await insert_notification(s, dedupe_key="probe:none", payload=payload, destination="d")
    async with acting(app_sessionmaker, world, "C1") as s:
        await insert_notification(
            s, dedupe_key="probe:c1", payload=payload, recipient=world.ids["S1"]
        )
        # duplicate dedupe key: ON CONFLICT DO NOTHING without a target is a silent no-op
        row = Notification(
            channel="email", purpose="p", lane="transactional", dedupe_key="world:c1"
        )
        row.id = uuid.uuid7()
        row.recipient_user_id = world.ids["C1"]
        row.payload = payload
        result = await s.execute(
            pg_insert(Notification.__table__).values(column_values(row)).on_conflict_do_nothing()
        )
        assert result.rowcount == 0  # type: ignore[attr-defined]
    async with acting(app_sessionmaker, world, "C1") as s:
        # with a conflict target PostgreSQL applies the SELECT policies, even without a conflict
        row.dedupe_key = "probe:target"
        with denied("row-level security"):
            await s.execute(
                pg_insert(Notification.__table__)
                .values(column_values(row))
                .on_conflict_do_nothing(index_elements=["dedupe_key"])
            )
    async with acting(app_sessionmaker, world, "C1") as s:
        with denied("new row violates row-level security policy"):
            await insert_notification(
                s,
                dedupe_key="probe:ret",
                payload=payload,
                recipient=world.ids["C1"],
                returning=True,
            )


@pytest.mark.parametrize("who", ["C1", "system"])
async def test_write_only_tables_refuse_orm_inserts(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession], who: str
) -> None:
    """With eager_defaults=False an ORM insert carries no RETURNING and PostgreSQL would accept
    it; the mapper guard keeps the rule "Core insert() only" unconditional."""
    async with acting(app_sessionmaker, world, who) as s:
        row = Notification(channel="email", purpose="p", lane="auth", dedupe_key="probe:orm")
        row.recipient_user_id = world.ids["C1"]
        row.payload = {"k": "v"}
        s.add(row)
        with pytest.raises(WriteOnlyTableError, match="Core insert"):
            await s.flush()
    async with acting(app_sessionmaker, world, who) as s:
        s.add(AuditLog(action="orm.insert", outcome="success"))
        with pytest.raises(WriteOnlyTableError, match="Core insert"):
            await s.flush()


async def test_audit_insert_with_returning_is_a_violation(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    audit = table("audit_log")
    async with acting(app_sessionmaker, world, "C1") as s:
        with denied("new row violates row-level security policy"):
            await s.execute(
                insert(audit).values(action="x", outcome="success").returning(audit.c.id)
            )


async def test_store_settings_and_audit_writes(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    settings_table = table("store_settings")
    async with acting(app_sessionmaker, world, "C1") as s:
        result = await s.execute(update(settings_table).values(config={"storeOpen": False}))
        assert result.rowcount == 0  # type: ignore[attr-defined]
    async with acting(app_sessionmaker, world, "A") as s:
        result = await s.execute(update(settings_table).values(config={"storeOpen": False}))
        assert result.rowcount == 1  # type: ignore[attr-defined]
    async with acting(app_sessionmaker, world, "none") as s:
        await insert_audit(s, action="auth.login_failed")  # no actor: allowed


# ---- privileges -----------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("statement", "message"),
    [
        (update(table("audit_log")).values(action="x"), "permission denied for table audit_log"),
        (delete(table("audit_log")), "permission denied for table audit_log"),
        (text("TRUNCATE bloomcraft.audit_log"), "permission denied for table audit_log"),
        (delete(table("users")), "permission denied for table users"),
        (delete(table("orders")), "permission denied for table orders"),
        (delete(table("order_items")), "permission denied for table order_items"),
        (delete(table("coupons")), "permission denied for table coupons"),
        (text("TRUNCATE bloomcraft.cart_items"), "permission denied for table cart_items"),
        (text("CREATE TABLE bloomcraft.probe (i int)"), "permission denied for schema bloomcraft"),
        (text("CREATE TABLE public.probe (i int)"), "permission denied for schema public"),
    ],
)
async def test_missing_privileges(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession], statement: Any, message: str
) -> None:
    async with acting(app_sessionmaker, world, "system") as s:
        with denied(message):
            await s.execute(statement)


async def test_row_security_cannot_be_switched_off(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "C1") as s:
        await s.execute(text("SET LOCAL row_security = off"))
        with denied("query would be affected by row-level security policy for table"):
            await s.execute(select(func.count()).select_from(ORDERS))


async def test_purge_audit_log(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    audit = table("audit_log")
    old = datetime.now(UTC) - timedelta(days=400)
    async with acting(app_sessionmaker, world, "none") as s:
        with denied("retain_days must be at least 365", code="22023"):
            await s.execute(text("SELECT bloomcraft.purge_audit_log(364)"))
    async with acting(app_sessionmaker, world, "none") as s:
        await s.execute(
            insert(audit).inline().values(action="old.1", outcome="success", occurred_at=old)
        )
        await s.execute(
            insert(audit).inline().values(action="old.2", outcome="success", occurred_at=old)
        )
        deleted = (await s.execute(text("SELECT bloomcraft.purge_audit_log(365)"))).scalar_one()
        assert deleted == 2
        async with system_context(s, "tests: count audit rows"):
            actions = set((await s.execute(select(audit.c.action))).scalars())
        assert actions == {"world.built", "world.checked"}


# ---- actor context hygiene ------------------------------------------------------------------


async def test_actor_does_not_leak_across_transactions(
    world: World, test_settings: Settings
) -> None:
    single = test_settings.model_copy(update={"db_pool_size": 1, "db_max_overflow": 0})
    engine = create_engine(single, application_name="bloomcraft-tests-pool")
    try:
        factory = create_sessionmaker(engine)
        c1 = Actor(world.ids["C1"], "customer")
        async with transaction(factory) as s:
            await set_actor(s, c1)
            pid = (await s.execute(text("SELECT pg_backend_pid()"))).scalar_one()
            assert await current_db_actor(s) == ("customer", world.ids["C1"])
        async with transaction(factory) as s:
            assert (await s.execute(text("SELECT pg_backend_pid()"))).scalar_one() == pid
            assert await current_db_actor(s) == ("none", None)
            assert (await s.execute(select(func.count()).select_from(ORDERS))).scalar_one() == 0
    finally:
        await engine.dispose()


async def test_system_context_restores_nests_and_logs(
    world: World,
    app_sessionmaker: async_sessionmaker[AsyncSession],
    captured_logs: list[dict[str, Any]],
) -> None:
    async with acting(app_sessionmaker, world, "C1") as s:
        async with system_context(s, "tests: outer"):
            assert await current_db_actor(s) == ("system", None)
            async with system_context(s, "tests: inner"):
                assert await current_db_actor(s) == ("system", None)
            assert await current_db_actor(s) == ("system", None)
        assert await current_db_actor(s) == ("customer", world.ids["C1"])
        with pytest.raises(ValueError, match="boom"):
            async with system_context(s, "tests: python error"):
                raise ValueError("boom")
        assert await current_db_actor(s) == ("customer", world.ids["C1"])
    events = [e for e in captured_logs if e["event"] == "system_context"]
    assert [e["reason"] for e in events] == ["tests: outer", "tests: inner", "tests: python error"]
    assert [e["previous_role"] for e in events] == ["customer", "system", "customer"]


async def test_system_context_does_not_mask_a_failed_statement(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "C1") as s:
        with pytest.raises(DBAPIError) as exc:
            async with system_context(s, "tests: failing statement"):
                await s.execute(text("SELECT 1 / 0"))
        assert sqlstate(exc.value) == "22012"


async def test_set_actor_requires_a_transaction(
    app_sessionmaker: async_sessionmaker[AsyncSession],
) -> None:
    async with app_sessionmaker() as s:
        with pytest.raises(ActorContextError):
            await set_actor(s, None)
        with pytest.raises(ActorContextError):
            async with system_context(s, "tests: no transaction"):
                pass


async def test_malformed_actor_id_errors(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession]
) -> None:
    async with acting(app_sessionmaker, world, "none") as s:
        await s.execute(
            text(
                "SELECT set_config('bc.actor_id', 'not-a-uuid', true), "
                "set_config('bc.actor_role', 'customer', true)"
            )
        )
        with denied("invalid input syntax for type uuid", code="22P02"):
            await s.execute(select(func.count()).select_from(ORDERS))


# ---- storefront_sellers view ----------------------------------------------------------------


async def test_storefront_sellers_view(
    world: World, app_sessionmaker: async_sessionmaker[AsyncSession], migrator_engine: AsyncEngine
) -> None:
    view = table("storefront_sellers")
    async with acting(app_sessionmaker, world, "C1") as s:
        sellers = set((await s.execute(select(view.c.seller_id))).scalars())
    assert sellers == {world.ids["S1"], world.ids["S2"]}
    async with acting(app_sessionmaker, world, "none") as s:
        assert (await s.execute(select(func.count()).select_from(view))).scalar_one() == 0
    async with migrator_engine.connect() as conn:
        columns = (
            (
                await conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = 'bloomcraft' AND table_name = 'storefront_sellers' "
                        "ORDER BY ordinal_position"
                    )
                )
            )
            .scalars()
            .all()
        )
    assert columns == [
        "seller_id",
        "shop_name",
        "slug",
        "bio",
        "accepting_orders",
        "default_lead_time_days",
    ]


# ---- code guard -----------------------------------------------------------------------------


def test_only_db_actor_touches_actor_settings() -> None:
    allowed = BACKEND_DIR / "app" / "db" / "actor.py"
    offenders = [
        str(path.relative_to(BACKEND_DIR))
        for path in (BACKEND_DIR / "app").rglob("*.py")
        if path != allowed
        and re.search(r"set_config|bc\.actor_role|bc\.actor_id", path.read_text(encoding="utf-8"))
    ]
    assert offenders == []
