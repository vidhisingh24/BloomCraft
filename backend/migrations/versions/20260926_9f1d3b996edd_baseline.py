"""baseline

Revision ID: 9f1d3b996edd
Revises:
Create Date: 2026-09-26 14:53:05.247294

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "9f1d3b996edd"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
