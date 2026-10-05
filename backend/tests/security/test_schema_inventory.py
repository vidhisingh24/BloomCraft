# ruff: noqa: S608 - catalog queries assembled from module constants, no external input
"""Inventory of schema ``bloomcraft``: every relation is classified, secured and granted exactly
what the design says — anything new or unclassified fails here."""

import re
from typing import Any

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

pytestmark = pytest.mark.db

APP = "bloomcraft_app"
OWNER = "bloomcraft_migrator"

# grants column of the Phase 2 matrix: S=SELECT I=INSERT U=UPDATE D=DELETE
RLS_TABLES: dict[str, str] = {
    "users": "SIU",
    "user_roles": "SIU",
    "seller_profiles": "SIU",
    "oauth_identities": "SIUD",
    "sessions": "SIUD",
    "addresses": "SIUD",
    "admin_invitations": "SIU",
    "blocked_identifiers": "SIUD",
    "oauth_transactions": "SIUD",
    "pending_signups": "SIUD",
    "verification_challenges": "SIUD",
    "one_time_tokens": "SIUD",
    "mfa_recovery_codes": "SIUD",
    "rate_limit_buckets": "SIUD",
    "wishlist_items": "SID",
    "cart_items": "SIUD",
    "coupon_redemptions": "SI",
    "orders": "SIU",
    "order_items": "SI",
    "order_status_events": "SI",
    "idempotency_records": "SIUD",
    "custom_requests": "SIU",
    "custom_request_images": "SID",
    "notifications": "SIUD",
    "legacy_customers": "SIU",
    "legacy_import_batches": "SI",
    "store_settings": "SIU",
    "audit_log": "SI",
}
NO_RLS_TABLES: dict[str, str] = {
    "categories": "SIU",
    "products": "SIU",
    "product_images": "SIUD",
    "coupons": "SIU",
}
VIEWS: dict[str, str] = {"storefront_sellers": "S"}
LETTER = {"SELECT": "S", "INSERT": "I", "UPDATE": "U", "DELETE": "D"}
PRIVILEGES = ("SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER")

NOT_EXTENSION_MEMBER = (
    "NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_class'::regclass "
    "AND d.objid = c.oid AND d.deptype = 'e')"
)
IN_SCHEMA = "c.relnamespace = 'bloomcraft'::regnamespace"


async def rows(engine: AsyncEngine, sql: str) -> list[Any]:
    async with engine.connect() as conn:
        return list((await conn.execute(text(sql))).all())


async def test_every_relation_is_classified_and_secured(migrator_engine: AsyncEngine) -> None:
    relations = await rows(
        migrator_engine,
        "SELECT c.relname, c.relkind::text, c.relrowsecurity, c.relforcerowsecurity, "
        "pg_get_userbyid(c.relowner) FROM pg_class c "
        f"WHERE {IN_SCHEMA} AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S') "
        f"AND {NOT_EXTENSION_MEMBER}",
    )
    by_kind: dict[str, set[str]] = {}
    for name, kind, rls, forced, owner in relations:
        by_kind.setdefault(kind, set()).add(name)
        assert owner == OWNER, name
        if name in RLS_TABLES:
            assert (rls, forced) == (True, True), name
        else:
            assert (rls, forced) == (False, False), name
    assert by_kind.pop("r") == set(RLS_TABLES) | set(NO_RLS_TABLES)
    assert by_kind.pop("v") == set(VIEWS)
    assert by_kind.pop("S") == {"audit_log_id_seq"}  # the identity column's sequence
    assert by_kind == {}, f"unclassified relations: {by_kind}"


async def test_policies(migrator_engine: AsyncEngine) -> None:
    policies = await rows(
        migrator_engine,
        "SELECT tablename, policyname, roles::text[], permissive, cmd FROM pg_policies "
        "WHERE schemaname = 'bloomcraft'",
    )
    tables_with_policies: set[str] = set()
    for table, name, roles, permissive, cmd in policies:
        tables_with_policies.add(table)
        assert list(roles) == [APP], name
        assert permissive == "PERMISSIVE", name
        assert re.fullmatch(rf"{table}_[a-z]+_{cmd.lower()}", name), name
    assert tables_with_policies == set(RLS_TABLES)


async def test_app_privileges_equal_the_grants(migrator_engine: AsyncEngine) -> None:
    granted = await rows(
        migrator_engine,
        "SELECT c.relname, p.priv FROM pg_class c "
        f"CROSS JOIN unnest(ARRAY{list(PRIVILEGES)!r}) AS p(priv) "
        f"WHERE {IN_SCHEMA} AND c.relkind IN ('r', 'v') "
        f"AND has_table_privilege('{APP}', c.oid, p.priv)",
    )
    actual: dict[str, set[str]] = {}
    for name, priv in granted:
        actual.setdefault(name, set()).add(priv)
    expected = {
        name: {priv for priv, letter in LETTER.items() if letter in letters}
        for name, letters in (RLS_TABLES | NO_RLS_TABLES | VIEWS).items()
    }
    assert actual == expected
    sequences = await rows(
        migrator_engine,
        f"SELECT c.relname FROM pg_class c WHERE {IN_SCHEMA} AND c.relkind = 'S' AND ("
        f"has_sequence_privilege('{APP}', c.oid, 'USAGE') OR "
        f"has_sequence_privilege('{APP}', c.oid, 'SELECT') OR "
        f"has_sequence_privilege('{APP}', c.oid, 'UPDATE'))",
    )
    assert sequences == []


async def test_nothing_is_granted_to_public(migrator_engine: AsyncEngine) -> None:
    relations = await rows(
        migrator_engine,
        f"SELECT c.relname FROM pg_class c, aclexplode(c.relacl) a WHERE {IN_SCHEMA} "
        "AND a.grantee = 0",
    )
    functions = await rows(
        migrator_engine,
        "SELECT p.proname FROM pg_proc p, "
        "aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a "
        "WHERE p.pronamespace = 'bloomcraft'::regnamespace AND a.grantee = 0",
    )
    schema = await rows(
        migrator_engine,
        "SELECT n.nspname, pg_get_userbyid(n.nspowner) FROM pg_namespace n "
        "WHERE n.nspname = 'bloomcraft'",
    )
    schema_public = await rows(
        migrator_engine,
        "SELECT 1 FROM pg_namespace n, aclexplode(n.nspacl) a "
        "WHERE n.nspname = 'bloomcraft' AND a.grantee = 0",
    )
    assert relations == []
    assert functions == []
    assert schema == [("bloomcraft", OWNER)]
    assert schema_public == []


async def test_functions(migrator_engine: AsyncEngine) -> None:
    functions = await rows(
        migrator_engine,
        "SELECT p.proname, pg_get_userbyid(p.proowner), p.prosecdef, p.provolatile::text, "
        f"p.proconfig, has_function_privilege('{APP}', p.oid, 'EXECUTE') "
        "FROM pg_proc p WHERE p.pronamespace = 'bloomcraft'::regnamespace",
    )
    by_name = {name: rest for name, *rest in functions}
    assert set(by_name) == {
        "actor_role",
        "actor_id",
        "touch_updated_at",
        "notify_outbox",
        "immutable_tags_text",
        "guard_orders_update",
        "guard_custom_requests_update",
        "guard_products_update",
        "purge_audit_log",
    }
    assert {name for name, (owner, *_rest) in by_name.items() if owner != OWNER} == set()
    assert {name for name, (_o, definer, *_rest) in by_name.items() if definer} == {
        "purge_audit_log"
    }
    assert by_name["purge_audit_log"][3] == ["search_path=pg_catalog, pg_temp"]
    assert by_name["actor_role"][2] == "s"  # STABLE, never IMMUTABLE
    assert by_name["actor_id"][2] == "s"
    assert by_name["immutable_tags_text"][2] == "i"
    executable = {name for name, (*_rest, can_execute) in by_name.items() if can_execute}
    assert executable == {"actor_role", "actor_id", "immutable_tags_text", "purge_audit_log"}


async def test_triggers(migrator_engine: AsyncEngine) -> None:
    with_updated_at = {
        name
        for (name,) in await rows(
            migrator_engine,
            "SELECT table_name FROM information_schema.columns "
            "WHERE table_schema = 'bloomcraft' AND column_name = 'updated_at' "
            "AND table_name <> 'storefront_sellers'",
        )
    }
    triggers = await rows(
        migrator_engine,
        "SELECT c.relname, t.tgname, p.proname FROM pg_trigger t "
        "JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_proc p ON p.oid = t.tgfoid "
        f"WHERE {IN_SCHEMA} AND NOT t.tgisinternal",
    )
    touch = {table for table, name, fn in triggers if fn == "touch_updated_at"}
    assert touch == with_updated_at
    assert all(
        name == f"trg_{table}_touch_updated_at"
        for table, name, fn in triggers
        if fn == "touch_updated_at"
    )
    others = {(table, name, fn) for table, name, fn in triggers if fn != "touch_updated_at"}
    assert others == {
        ("orders", "trg_orders_guard", "guard_orders_update"),
        ("custom_requests", "trg_custom_requests_guard", "guard_custom_requests_update"),
        ("products", "trg_products_guard", "guard_products_update"),
        ("notifications", "trg_notifications_notify", "notify_outbox"),
    }
    assert len(with_updated_at) == 24


async def test_every_foreign_key_leads_an_index(migrator_engine: AsyncEngine) -> None:
    unindexed = await rows(
        migrator_engine,
        "SELECT con.conname FROM pg_constraint con "
        "WHERE con.connamespace = 'bloomcraft'::regnamespace AND con.contype = 'f' "
        "AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = con.conrelid "
        "AND i.indkey[0] = con.conkey[1])",
    )
    assert unindexed == []
    total = await rows(
        migrator_engine,
        "SELECT count(*) FROM pg_constraint "
        "WHERE connamespace = 'bloomcraft'::regnamespace AND contype = 'f'",
    )
    assert total[0][0] > 30


async def test_constraint_names_fit_postgres_limit(migrator_engine: AsyncEngine) -> None:
    names = await rows(
        migrator_engine,
        "SELECT conname FROM pg_constraint WHERE connamespace = 'bloomcraft'::regnamespace "
        "AND contype <> 'n' "  # PostgreSQL 18 records NOT NULL constraints too
        "UNION ALL SELECT c.relname FROM pg_class c WHERE "
        f"{IN_SCHEMA} AND c.relkind = 'i'",
    )
    assert all(len(name) <= 63 for (name,) in names)
    assert all(re.match(r"(pk|fk|uq|ix|ck)_", name) for (name,) in names)
