"""bloomcraft schema, pg_trgm, actor and trigger functions

Revision ID: a7834655c4bc
Revises: 65571c04bae8
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

from migrations.sqlhelpers_v1 import execute

# revision identifiers, used by Alembic.
revision: str = "a7834655c4bc"
down_revision: str | Sequence[str] | None = "65571c04bae8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# STABLE, never IMMUTABLE: an immutable actor function would be folded into cached plans and
# one request's actor would answer the next request's queries. Unset or '' (a pooled
# connection after a committed local setting) → 'none' / NULL → zero rows; a malformed id raises.
ACTOR_ROLE = """
CREATE FUNCTION bloomcraft.actor_role() RETURNS text
LANGUAGE sql STABLE PARALLEL SAFE AS $fn$
  SELECT CASE pg_catalog.current_setting('bc.actor_role', true)
    WHEN 'customer' THEN 'customer' WHEN 'seller' THEN 'seller'
    WHEN 'admin' THEN 'admin' WHEN 'system' THEN 'system' ELSE 'none' END
$fn$
"""

ACTOR_ID = """
CREATE FUNCTION bloomcraft.actor_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE AS $fn$
  SELECT NULLIF(pg_catalog.current_setting('bc.actor_id', true), '')::uuid
$fn$
"""

TOUCH_UPDATED_AT = """
CREATE FUNCTION bloomcraft.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END
$fn$
"""

NOTIFY_OUTBOX = """
CREATE FUNCTION bloomcraft.notify_outbox() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM pg_catalog.pg_notify('bc_outbox', NEW.lane);
  RETURN NULL;
END
$fn$
"""

# array_to_string is only STABLE, so it can't appear in a generation expression directly.
IMMUTABLE_TAGS_TEXT = """
CREATE FUNCTION bloomcraft.immutable_tags_text(tags text[]) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $fn$
  SELECT pg_catalog.array_to_string(tags, ' ')
$fn$
"""

FUNCTIONS = (
    "bloomcraft.actor_role()",
    "bloomcraft.actor_id()",
    "bloomcraft.touch_updated_at()",
    "bloomcraft.notify_outbox()",
    "bloomcraft.immutable_tags_text(text[])",
)


def upgrade() -> None:
    """Upgrade schema."""
    execute(
        "CREATE SCHEMA bloomcraft",
        "REVOKE ALL ON SCHEMA bloomcraft FROM PUBLIC",
        "GRANT USAGE ON SCHEMA bloomcraft TO bloomcraft_app",
        # Trusted extension; kept in public so % and similarity() stay on the default path.
        "CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public",
        # The global form: the per-schema form can't take away PUBLIC's built-in EXECUTE.
        "ALTER DEFAULT PRIVILEGES FOR ROLE bloomcraft_migrator "
        "REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC",
    )
    execute(
        ACTOR_ROLE,
        "REVOKE ALL ON FUNCTION bloomcraft.actor_role() FROM PUBLIC",
        "GRANT EXECUTE ON FUNCTION bloomcraft.actor_role() TO bloomcraft_app",
        ACTOR_ID,
        "REVOKE ALL ON FUNCTION bloomcraft.actor_id() FROM PUBLIC",
        "GRANT EXECUTE ON FUNCTION bloomcraft.actor_id() TO bloomcraft_app",
        # Trigger functions need no EXECUTE grant.
        TOUCH_UPDATED_AT,
        "REVOKE ALL ON FUNCTION bloomcraft.touch_updated_at() FROM PUBLIC",
        NOTIFY_OUTBOX,
        "REVOKE ALL ON FUNCTION bloomcraft.notify_outbox() FROM PUBLIC",
        # Generation expressions are permission-checked on insert: the app needs EXECUTE.
        IMMUTABLE_TAGS_TEXT,
        "REVOKE ALL ON FUNCTION bloomcraft.immutable_tags_text(text[]) FROM PUBLIC",
        "GRANT EXECUTE ON FUNCTION bloomcraft.immutable_tags_text(text[]) TO bloomcraft_app",
    )


def downgrade() -> None:
    """Downgrade schema."""
    execute(*(f"DROP FUNCTION {function}" for function in reversed(FUNCTIONS)))
    execute(
        "ALTER DEFAULT PRIVILEGES FOR ROLE bloomcraft_migrator "
        "GRANT EXECUTE ON FUNCTIONS TO PUBLIC",
        "DROP EXTENSION IF EXISTS pg_trgm",
        # No CASCADE: leftovers must fail loudly.
        "DROP SCHEMA bloomcraft",
    )
