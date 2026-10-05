"""grant alembic_version to app

Revision ID: 65571c04bae8
Revises: 9f1d3b996edd
Create Date: 2026-09-26 14:58:28.175747

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "65571c04bae8"
down_revision: str | Sequence[str] | None = "9f1d3b996edd"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # /health/ready runs as the app role and compares the DB version with the script head.
    op.execute("GRANT SELECT ON TABLE public.alembic_version TO bloomcraft_app")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("REVOKE SELECT ON TABLE public.alembic_version FROM bloomcraft_app")
