"""SQL helpers for the Phase 2 revisions (grants, RLS policies, triggers).

FROZEN: applied revisions import this module, so existing functions must never change
behaviour. Add new helpers (or a ``sqlhelpers_v2``) instead.
"""

from collections.abc import Mapping, Sequence

from alembic import op

SCHEMA = "bloomcraft"
APP_ROLE = "bloomcraft_app"

ROLE = "bloomcraft.actor_role()"
ACTOR = "bloomcraft.actor_id()"

ADMIN = f"{ROLE} = 'admin'"
SYSTEM = f"{ROLE} = 'system'"
EVERYONE = "true"
ANY_ACTOR = f"{ROLE} <> 'none'"

COMMANDS = ("SELECT", "INSERT", "UPDATE", "DELETE")


def own(column: str) -> str:
    """The row belongs to the actor (any signed-in role)."""
    return f"{ROLE} IN ('customer', 'seller', 'admin') AND {column} = {ACTOR}"


def as_role(role: str, predicate: str) -> str:
    return f"{ROLE} = '{role}' AND {predicate}"


def parent(table: str, fk_column: str) -> str:
    """The parent row is visible to the actor (applies the parent's own policies)."""
    return f"EXISTS (SELECT 1 FROM {SCHEMA}.{table} p WHERE p.id = {fk_column})"  # noqa: S608 - constant identifiers


def execute(*statements: str) -> None:
    for statement in statements:
        op.execute(statement)


def grant(table: str, privileges: Sequence[str]) -> None:
    execute(f"GRANT {', '.join(privileges)} ON TABLE {SCHEMA}.{table} TO {APP_ROLE}")


def enable_rls(table: str) -> None:
    execute(
        f"ALTER TABLE {SCHEMA}.{table} ENABLE ROW LEVEL SECURITY",
        f"ALTER TABLE {SCHEMA}.{table} FORCE ROW LEVEL SECURITY",
    )


def policy(table: str, who: str, command: str, expression: str) -> None:
    """Permissive policy ``<table>_<who>_<command>`` for the app role. UPDATE keeps WITH CHECK
    equal to USING (the default), so an owner can't hand a row to someone else."""
    if command not in COMMANDS:
        raise ValueError(command)
    clause = "WITH CHECK" if command == "INSERT" else "USING"
    execute(
        f"CREATE POLICY {table}_{who}_{command.lower()} ON {SCHEMA}.{table} "
        f"AS PERMISSIVE FOR {command} TO {APP_ROLE} {clause} ({expression})"
    )


def touch_trigger(table: str) -> None:
    execute(
        f"CREATE TRIGGER trg_{table}_touch_updated_at BEFORE UPDATE ON {SCHEMA}.{table} "
        f"FOR EACH ROW EXECUTE FUNCTION {SCHEMA}.touch_updated_at()"
    )


def secure_table(
    table: str,
    grants: Sequence[str],
    policies: Mapping[str, Mapping[str, str]] | None = None,
    *,
    touch: bool = True,
) -> None:
    """Grants, the ``updated_at`` trigger and, when ``policies`` is given (command → who →
    expression), ENABLE + FORCE row-level security with those policies."""
    grant(table, grants)
    if touch:
        touch_trigger(table)
    if policies is not None:
        enable_rls(table)
        for command, by_who in policies.items():
            for who, expression in by_who.items():
                policy(table, who, command, expression)


def guard_trigger(table: str, rules: Sequence[tuple[str, str]]) -> None:
    """``BEFORE UPDATE`` ownership guard. ``rules`` = (column, condition under which it may
    change; ``r`` is the actor role). Violations raise SQLSTATE 42501 naming the column only."""
    checks = "\n".join(
        f"  IF NEW.{column} IS DISTINCT FROM OLD.{column} AND NOT ({allowed}) THEN\n"
        f"    RAISE EXCEPTION USING ERRCODE = '42501',\n"
        f"      MESSAGE = 'permission denied: {table}.{column} cannot be changed by role ' || r;\n"
        f"  END IF;"
        for column, allowed in rules
    )
    function = f"{SCHEMA}.guard_{table}_update()"
    execute(
        f"CREATE FUNCTION {function} RETURNS trigger LANGUAGE plpgsql AS $fn$\n"
        f"DECLARE\n  r text := {ROLE};\nBEGIN\n{checks}\n  RETURN NEW;\nEND\n$fn$",
        f"REVOKE ALL ON FUNCTION {function} FROM PUBLIC",
        f"CREATE TRIGGER trg_{table}_guard BEFORE UPDATE ON {SCHEMA}.{table} "
        f"FOR EACH ROW EXECUTE FUNCTION {function}",
    )


def drop_guard_function(table: str) -> None:
    execute(f"DROP FUNCTION {SCHEMA}.guard_{table}_update()")
