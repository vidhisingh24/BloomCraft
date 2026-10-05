"""commerce: coupons, orders, items, status events, idempotency

Revision ID: 7ea8c0cc514a
Revises: 4c0fa49f65f1
Create Date: 2026-09-26 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from migrations.sqlhelpers_v1 import (
    ACTOR,
    ADMIN,
    ROLE,
    SYSTEM,
    as_role,
    drop_guard_function,
    guard_trigger,
    own,
    parent,
    secure_table,
)

# revision identifiers, used by Alembic.
revision: str = "7ea8c0cc514a"
down_revision: str | Sequence[str] | None = "4c0fa49f65f1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# RLS can't see which columns an UPDATE changes; these guards stop a buggy endpoint from
# re-pointing an order to another person.
ORDER_GUARD_RULES = [
    *(
        (column, "r = 'system'")
        for column in (
            "seller_id",
            "order_number",
            "checkout_id",
            "source",
            "placed_at",
            "subtotal_paise",
            "delivery_paise",
            "gift_wrap_paise",
            "discount_paise",
            "total_paise",
        )
    ),
    ("customer_id", "r = 'system' OR (r = 'admin' AND OLD.source = 'legacy_import')"),
]

EVENT_VISIBLE = (
    f"{parent('orders', 'order_id')} AND ({ROLE} <> 'customer' OR visibility = 'customer')"
)
EVENT_INSERT = (
    f"{parent('orders', 'order_id')} AND actor_user_id = {ACTOR} AND actor_role = {ROLE} "
    f"AND ({ROLE} <> 'customer' OR visibility = 'customer')"
)


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "coupons",
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False),
        sa.Column("min_order_paise", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("max_discount_paise", sa.Integer(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("usage_limit_total", sa.Integer(), nullable=True),
        sa.Column("usage_limit_per_user", sa.Integer(), nullable=True),
        sa.Column(
            "first_order_only", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("times_redeemed", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("type IN ('percentage', 'flat')", name=op.f("ck_coupons_type")),
        sa.CheckConstraint(
            "value > 0 AND (type <> 'percentage' OR value <= 100)", name=op.f("ck_coupons_value")
        ),
        sa.CheckConstraint(
            "code = upper(code) AND char_length(code) BETWEEN 3 AND 32",
            name=op.f("ck_coupons_code"),
        ),
        sa.CheckConstraint(
            "max_discount_paise IS NULL OR max_discount_paise >= 0",
            name=op.f("ck_coupons_max_discount_paise"),
        ),
        sa.CheckConstraint("min_order_paise >= 0", name=op.f("ck_coupons_min_order_paise")),
        sa.CheckConstraint(
            "starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at",
            name=op.f("ck_coupons_window"),
        ),
        sa.CheckConstraint(
            "times_redeemed >= 0 AND (usage_limit_total IS NULL OR times_redeemed <= "
            "usage_limit_total)",
            name=op.f("ck_coupons_times_redeemed"),
        ),
        sa.CheckConstraint(
            "usage_limit_per_user IS NULL OR usage_limit_per_user > 0",
            name=op.f("ck_coupons_usage_limit_per_user"),
        ),
        sa.CheckConstraint(
            "usage_limit_total IS NULL OR usage_limit_total > 0",
            name=op.f("ck_coupons_usage_limit_total"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_coupons")),
        sa.UniqueConstraint("code", name=op.f("uq_coupons_code")),
        schema="bloomcraft",
    )
    secure_table(
        "coupons",
        ["SELECT", "INSERT", "UPDATE"],
    )
    op.create_table(
        "coupon_redemptions",
        sa.Column("coupon_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("checkout_id", sa.Uuid(), nullable=False),
        sa.Column("discount_paise", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "discount_paise >= 0", name=op.f("ck_coupon_redemptions_discount_paise")
        ),
        sa.ForeignKeyConstraint(
            ["coupon_id"],
            ["bloomcraft.coupons.id"],
            name=op.f("fk_coupon_redemptions_coupon_id_coupons"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_coupon_redemptions_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_coupon_redemptions")),
        sa.UniqueConstraint("checkout_id", name=op.f("uq_coupon_redemptions_checkout_id")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_coupon_redemptions_coupon_id_user_id",
        "coupon_redemptions",
        ["coupon_id", "user_id"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_coupon_redemptions_user_id",
        "coupon_redemptions",
        ["user_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "coupon_redemptions",
        ["SELECT", "INSERT"],
        {
            "SELECT": {
                "own": own("user_id"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "customer": as_role("customer", f"user_id = {ACTOR}"),
                "system": SYSTEM,
            },
        },
        touch=False,
    )
    op.create_table(
        "orders",
        sa.Column("order_number", sa.Text(), nullable=False),
        sa.Column("checkout_id", sa.Uuid(), nullable=True),
        sa.Column("customer_id", sa.Uuid(), nullable=True),
        sa.Column("legacy_customer_id", sa.Uuid(), nullable=True),
        sa.Column("seller_id", sa.Uuid(), nullable=False),
        sa.Column("source", sa.Text(), server_default=sa.text("'web'"), nullable=False),
        sa.Column("status", sa.Text(), server_default=sa.text("'placed'"), nullable=False),
        sa.Column("cancel_reason", sa.Text(), nullable=True),
        sa.Column("delivery_method", sa.Text(), nullable=False),
        sa.Column("delivery_details", sa.LargeBinary(), nullable=False),
        sa.Column("delivery_city", sa.Text(), nullable=True),
        sa.Column("delivery_pincode", sa.Text(), nullable=True),
        sa.Column("preferred_date", sa.Date(), nullable=True),
        sa.Column("contact_name", sa.LargeBinary(), nullable=False),
        sa.Column("contact_phone", sa.LargeBinary(), nullable=True),
        sa.Column("contact_email", sa.LargeBinary(), nullable=True),
        sa.Column("subtotal_paise", sa.Integer(), nullable=False),
        sa.Column("delivery_paise", sa.Integer(), nullable=False),
        sa.Column("gift_wrap_paise", sa.Integer(), nullable=False),
        sa.Column("discount_paise", sa.Integer(), nullable=False),
        sa.Column("total_paise", sa.Integer(), nullable=False),
        sa.Column(
            "gift_wrap_requested", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column("gift_message", sa.LargeBinary(), nullable=True),
        sa.Column("coupon_code", sa.Text(), nullable=True),
        sa.Column("payment_method", sa.Text(), nullable=True),
        sa.Column("payment_status", sa.Text(), server_default=sa.text("'pending'"), nullable=False),
        sa.Column("upi_txn_ref", sa.LargeBinary(), nullable=True),
        sa.Column("payment_verified_by", sa.Uuid(), nullable=True),
        sa.Column("payment_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("shipment_carrier", sa.Text(), nullable=True),
        sa.Column("shipment_tracking_ref", sa.Text(), nullable=True),
        sa.Column("terms_version", sa.Text(), nullable=True),
        sa.Column(
            "placed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("preparing_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ready_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("shipped_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("legacy_ref", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "cancel_reason IN ('customer_request', 'seller_rejected', 'admin')",
            name=op.f("ck_orders_cancel_reason"),
        ),
        sa.CheckConstraint(
            "cancel_reason IS NULL OR status = 'cancelled'",
            name=op.f("ck_orders_cancel_reason_status"),
        ),
        sa.CheckConstraint(
            "delivery_method IN ('vadodara_local', 'college', 'parcel')",
            name=op.f("ck_orders_delivery_method"),
        ),
        sa.CheckConstraint(
            "order_number ~ '^BC-[0-9]{4}-[0-9A-HJKMNP-TV-Z]{6}$'",
            name=op.f("ck_orders_order_number_format"),
        ),
        sa.CheckConstraint(
            "payment_method IN ('upi', 'cod')", name=op.f("ck_orders_payment_method")
        ),
        sa.CheckConstraint(
            "payment_status IN ('pending', 'awaiting_verification', 'paid', 'failed', 'refunded')",
            name=op.f("ck_orders_payment_status"),
        ),
        sa.CheckConstraint(
            "source = 'legacy_import' OR checkout_id IS NOT NULL",
            name=op.f("ck_orders_checkout_id_required"),
        ),
        sa.CheckConstraint(
            "source = 'legacy_import' OR contact_email IS NOT NULL",
            name=op.f("ck_orders_contact_email_required"),
        ),
        sa.CheckConstraint(
            "source = 'legacy_import' OR contact_phone IS NOT NULL",
            name=op.f("ck_orders_contact_phone_required"),
        ),
        sa.CheckConstraint(
            "source = 'legacy_import' OR legacy_customer_id IS NULL",
            name=op.f("ck_orders_legacy_customer_source"),
        ),
        sa.CheckConstraint(
            "source = 'legacy_import' OR legacy_ref IS NULL",
            name=op.f("ck_orders_legacy_ref_source"),
        ),
        sa.CheckConstraint(
            "source = 'legacy_import' OR payment_method IS NOT NULL",
            name=op.f("ck_orders_payment_method_required"),
        ),
        sa.CheckConstraint(
            "source = 'legacy_import' OR terms_version IS NOT NULL",
            name=op.f("ck_orders_terms_version_required"),
        ),
        sa.CheckConstraint("source IN ('web', 'legacy_import')", name=op.f("ck_orders_source")),
        sa.CheckConstraint(
            "status IN ('placed', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', "
            "'cancelled')",
            name=op.f("ck_orders_status"),
        ),
        sa.CheckConstraint(
            "customer_id IS NOT NULL OR legacy_customer_id IS NOT NULL",
            name=op.f("ck_orders_has_customer"),
        ),
        sa.CheckConstraint("delivery_paise >= 0", name=op.f("ck_orders_delivery_paise")),
        sa.CheckConstraint("discount_paise >= 0", name=op.f("ck_orders_discount_paise")),
        sa.CheckConstraint("gift_wrap_paise >= 0", name=op.f("ck_orders_gift_wrap_paise")),
        sa.CheckConstraint("subtotal_paise >= 0", name=op.f("ck_orders_subtotal_paise")),
        sa.CheckConstraint(
            "total_paise = subtotal_paise + delivery_paise + gift_wrap_paise - discount_paise",
            name=op.f("ck_orders_total_formula"),
        ),
        sa.CheckConstraint("total_paise >= 0", name=op.f("ck_orders_total_paise")),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_orders_customer_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["legacy_customer_id"],
            ["bloomcraft.legacy_customers.id"],
            name=op.f("fk_orders_legacy_customer_id_legacy_customers"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["payment_verified_by"],
            ["bloomcraft.users.id"],
            name=op.f("fk_orders_payment_verified_by_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["seller_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_orders_seller_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_orders")),
        sa.UniqueConstraint("legacy_ref", name=op.f("uq_orders_legacy_ref")),
        sa.UniqueConstraint("order_number", name=op.f("uq_orders_order_number")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_orders_checkout_id", "orders", ["checkout_id"], unique=False, schema="bloomcraft"
    )
    op.create_index(
        "ix_orders_customer_id_placed_at",
        "orders",
        ["customer_id", "placed_at"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_orders_legacy_customer_id",
        "orders",
        ["legacy_customer_id"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_orders_payment_verified_by",
        "orders",
        ["payment_verified_by"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_orders_seller_id_status_placed_at",
        "orders",
        ["seller_id", "status", "placed_at"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "orders",
        ["SELECT", "INSERT", "UPDATE"],
        {
            "SELECT": {
                "customer": as_role("customer", f"customer_id = {ACTOR}"),
                "seller": as_role("seller", f"seller_id = {ACTOR}"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
            "INSERT": {
                "customer": as_role("customer", f"customer_id = {ACTOR} AND source = 'web'"),
                "system": SYSTEM,
            },
            "UPDATE": {
                "customer": as_role("customer", f"customer_id = {ACTOR}"),
                "seller": as_role("seller", f"seller_id = {ACTOR}"),
                "admin": ADMIN,
                "system": SYSTEM,
            },
        },
    )
    guard_trigger("orders", ORDER_GUARD_RULES)
    op.create_table(
        "order_items",
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("product_id", sa.Uuid(), nullable=True),
        sa.Column("sku", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("image_key", sa.Text(), nullable=True),
        sa.Column("unit_price_paise", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("line_total_paise", sa.Integer(), nullable=False),
        sa.Column("selected_color", sa.Text(), nullable=True),
        sa.Column("custom_note", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "custom_note IS NULL OR char_length(custom_note) <= 30",
            name=op.f("ck_order_items_custom_note_length"),
        ),
        sa.CheckConstraint(
            "line_total_paise = unit_price_paise * quantity", name=op.f("ck_order_items_line_total")
        ),
        sa.CheckConstraint("quantity >= 1", name=op.f("ck_order_items_quantity")),
        sa.CheckConstraint("unit_price_paise >= 0", name=op.f("ck_order_items_unit_price_paise")),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["bloomcraft.orders.id"],
            name=op.f("fk_order_items_order_id_orders"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["bloomcraft.products.id"],
            name=op.f("fk_order_items_product_id_products"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_items")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_order_items_order_id", "order_items", ["order_id"], unique=False, schema="bloomcraft"
    )
    op.create_index(
        "ix_order_items_product_id",
        "order_items",
        ["product_id"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "order_items",
        ["SELECT", "INSERT"],
        {
            "SELECT": {
                "parent": parent("orders", "order_id"),
            },
            "INSERT": {
                "customer": as_role("customer", parent("orders", "order_id")),
                "system": SYSTEM,
            },
        },
        touch=False,
    )
    op.create_table(
        "order_status_events",
        sa.Column("order_id", sa.Uuid(), nullable=False),
        sa.Column("from_status", sa.Text(), nullable=True),
        sa.Column("to_status", sa.Text(), nullable=False),
        sa.Column("actor_user_id", sa.Uuid(), nullable=True),
        sa.Column("actor_role", sa.Text(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("visibility", sa.Text(), server_default=sa.text("'customer'"), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "actor_role IN ('customer', 'seller', 'admin', 'system')",
            name=op.f("ck_order_status_events_actor_role"),
        ),
        sa.CheckConstraint(
            "from_status IN ('placed', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', "
            "'cancelled')",
            name=op.f("ck_order_status_events_from_status"),
        ),
        sa.CheckConstraint(
            "to_status IN ('placed', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', "
            "'cancelled')",
            name=op.f("ck_order_status_events_to_status"),
        ),
        sa.CheckConstraint(
            "visibility IN ('customer', 'internal')", name=op.f("ck_order_status_events_visibility")
        ),
        sa.CheckConstraint(
            "note IS NULL OR char_length(note) <= 280",
            name=op.f("ck_order_status_events_note_length"),
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_order_status_events_actor_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["bloomcraft.orders.id"],
            name=op.f("fk_order_status_events_order_id_orders"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_status_events")),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_order_status_events_actor_user_id",
        "order_status_events",
        ["actor_user_id"],
        unique=False,
        schema="bloomcraft",
    )
    op.create_index(
        "ix_order_status_events_order_id_created_at",
        "order_status_events",
        ["order_id", "created_at"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "order_status_events",
        ["SELECT", "INSERT"],
        {
            "SELECT": {
                "parent": EVENT_VISIBLE,
            },
            "INSERT": {
                "parent": EVENT_INSERT,
                "system": SYSTEM,
            },
        },
        touch=False,
    )
    op.create_table(
        "idempotency_records",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("scope", sa.Text(), nullable=False),
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("request_hash", sa.LargeBinary(), nullable=False),
        sa.Column("state", sa.Text(), nullable=False),
        sa.Column("response_status", sa.SmallInteger(), nullable=True),
        sa.Column("response_body", sa.LargeBinary(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("uuidv7()"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "state <> 'completed' OR response_status IS NOT NULL",
            name=op.f("ck_idempotency_records_completed_response"),
        ),
        sa.CheckConstraint(
            "state IN ('in_progress', 'completed')", name=op.f("ck_idempotency_records_state")
        ),
        sa.CheckConstraint(
            "char_length(key) BETWEEN 1 AND 255", name=op.f("ck_idempotency_records_key_length")
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["bloomcraft.users.id"],
            name=op.f("fk_idempotency_records_user_id_users"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_idempotency_records")),
        sa.UniqueConstraint(
            "user_id", "scope", "key", name=op.f("uq_idempotency_records_user_id_scope_key")
        ),
        schema="bloomcraft",
    )
    op.create_index(
        "ix_idempotency_records_expires_at",
        "idempotency_records",
        ["expires_at"],
        unique=False,
        schema="bloomcraft",
    )
    secure_table(
        "idempotency_records",
        ["SELECT", "INSERT", "UPDATE", "DELETE"],
        {
            "SELECT": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "INSERT": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "UPDATE": {
                "own": own("user_id"),
                "system": SYSTEM,
            },
            "DELETE": {
                "system": SYSTEM,
            },
        },
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("idempotency_records", schema="bloomcraft")
    op.drop_table("order_status_events", schema="bloomcraft")
    op.drop_table("order_items", schema="bloomcraft")
    op.drop_table("orders", schema="bloomcraft")
    op.drop_table("coupon_redemptions", schema="bloomcraft")
    op.drop_table("coupons", schema="bloomcraft")
    drop_guard_function("orders")
