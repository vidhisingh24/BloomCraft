"""coupon_description

Revision ID: 718f86e4b250
Revises: 8001a271159c
Create Date: 2026-09-27 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "718f86e4b250"
down_revision: str | Sequence[str] | None = "8001a271159c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # The storefront shows this text when a code is applied. The table-level grants cover it.
    op.add_column(
        "coupons", sa.Column("description", sa.Text(), nullable=True), schema="bloomcraft"
    )
    op.create_check_constraint(
        op.f("ck_coupons_description"),
        "coupons",
        "description IS NULL OR char_length(description) BETWEEN 1 AND 200",
        schema="bloomcraft",
    )


def downgrade() -> None:
    """Downgrade schema."""
    # op.f(): without it the naming convention would be applied a second time
    # (ck_coupons_ck_coupons_description).
    op.drop_constraint(
        op.f("ck_coupons_description"), "coupons", type_="check", schema="bloomcraft"
    )
    op.drop_column("coupons", "description", schema="bloomcraft")
