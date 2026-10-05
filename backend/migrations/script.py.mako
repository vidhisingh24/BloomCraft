<%
    body = (upgrades or "") + (downgrades or "")

    def q(value):
        if isinstance(value, str):
            return '"%s"' % value
        if isinstance(value, (list, tuple)):
            return "(" + ", ".join('"%s"' % v for v in value) + ("," if len(value) == 1 else "") + ")"
        return repr(value)
%>"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""

from collections.abc import Sequence
% if "sa." in body or "op." in body or imports:

% endif
% if "sa." in body:
import sqlalchemy as sa
% endif
% if "op." in body:
from alembic import op
% endif
% if imports:
${imports}
% endif

# revision identifiers, used by Alembic.
revision: str = "${up_revision}"
down_revision: str | Sequence[str] | None = ${q(down_revision)}
branch_labels: str | Sequence[str] | None = ${q(branch_labels)}
depends_on: str | Sequence[str] | None = ${q(depends_on)}


def upgrade() -> None:
    """Upgrade schema."""
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    """Downgrade schema."""
    ${downgrades if downgrades else "pass"}
