"""Row builders for tests. They create rows through the models (so encryption and blind
indexes run) and must be called inside ``system_context`` with test keys installed.

``build_world`` creates one row set covering every RLS table; ``World.plaintexts`` lists every
value written to an encrypted column (the dump test searches for them).
"""

import hashlib
import secrets
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import (
    AdminInvitation,
    BlockedIdentifier,
    MfaRecoveryCode,
    OAuthIdentity,
    OAuthTransaction,
    OneTimeToken,
    PendingSignup,
    Session,
    User,
    UserRole,
    VerificationChallenge,
)
from app.core.ids import new_id, new_reference
from app.core.rate_limit import RateLimitBucket
from app.crypto.blind_index import blind_index
from app.crypto.tokens import code_hmac, hash_token, new_token
from app.db.base import Base, column_values
from app.modules.accounts.models import Address
from app.modules.audit.models import AuditLog
from app.modules.cart.models import CartItem
from app.modules.catalog.models import Category, Product
from app.modules.checkout.models import Coupon, CouponRedemption, IdempotencyRecord
from app.modules.custom_requests.models import CustomRequest, CustomRequestImage
from app.modules.legacy.models import LegacyCustomer, LegacyImportBatch
from app.modules.notifications.models import Notification
from app.modules.orders.models import Order, OrderItem, OrderStatusEvent
from app.modules.sellers.models import SellerProfile
from app.modules.storefront.models import StoreSettings
from app.modules.wishlist.models import WishlistItem

TERMS = "2026-09"


def now() -> datetime:
    return datetime.now(UTC)


async def flush(session: AsyncSession, *objects: Base) -> None:
    session.add_all(objects)
    await session.flush()


async def create_user(
    session: AsyncSession,
    *,
    full_name: str,
    email: str,
    phone: str | None = None,
    roles: dict[str, str] | None = None,
    status: str = "active",
) -> User:
    """``roles`` maps role → grant status (default: an active customer grant)."""
    user = User(
        full_name=full_name,
        status=status,
        created_via="password",
        email_verified_at=now(),
        consent_terms_version=TERMS,
        consent_privacy_version=TERMS,
        consent_at=now(),
    )
    user.email = email
    if phone is not None:
        user.phone = phone
        user.phone_verified_at = now()
    await flush(session, user)
    for role, grant_status in (roles or {"customer": "active"}).items():
        via = "signup" if role == "customer" else ("application" if role == "seller" else "invite")
        session.add(UserRole(user_id=user.id, role=role, status=grant_status, granted_via=via))
    await session.flush()
    return user


async def create_seller(
    session: AsyncSession,
    *,
    name: str,
    email: str,
    slug: str,
    grant_status: str = "active",
    whatsapp: str | None = None,
) -> User:
    user = await create_user(
        session,
        full_name=name,
        email=email,
        roles={"customer": "active", "seller": grant_status},
    )
    profile = SellerProfile(user_id=user.id, shop_name=f"{name} Studio", slug=slug)
    profile.contact_whatsapp = whatsapp
    await flush(session, profile)
    return user


async def create_product(
    session: AsyncSession, *, seller: User, category: Category, sku: str
) -> Product:
    product = Product(
        seller_id=seller.id,
        category_id=category.id,
        sku=sku,
        slug=sku,
        name=f"Tulip charm {sku}",
        price_paise=14000,
        tags=["tulip", "gift"],
        status="active",
    )
    await flush(session, product)
    return product


async def create_order(
    session: AsyncSession,
    *,
    seller: User,
    product: Product,
    customer: User | None = None,
    legacy_customer: LegacyCustomer | None = None,
    contact: dict[str, str],
) -> Order:
    legacy = customer is None
    order = Order(
        order_number=new_reference("BC", 2026),
        checkout_id=None if legacy else new_id(),
        customer_id=customer.id if customer else None,
        legacy_customer_id=legacy_customer.id if legacy_customer else None,
        seller_id=seller.id,
        source="legacy_import" if legacy else "web",
        delivery_method="vadodara_local",
        delivery_city="Vadodara",
        delivery_pincode="390001",
        subtotal_paise=28000,
        delivery_paise=0,
        gift_wrap_paise=4000,
        discount_paise=0,
        total_paise=32000,
        gift_wrap_requested=True,
        payment_method="upi",
        terms_version=None if legacy else TERMS,
        legacy_ref=f"L-{secrets.token_hex(4)}" if legacy else None,
    )
    order.delivery_details = {
        "area": contact["area"],
        "slot": "evening",
        "message": contact["note"],
    }
    order.contact_name = contact["name"]
    order.contact_phone = contact["phone"]
    order.contact_email = contact["email"]
    order.gift_message = contact["gift"]
    order.upi_txn_ref = contact["upi"]
    await flush(session, order)
    item = OrderItem(
        order_id=order.id,
        product_id=product.id,
        sku=product.sku,
        name=product.name,
        unit_price_paise=14000,
        quantity=2,
        line_total_paise=28000,
    )
    placed = OrderStatusEvent(
        order_id=order.id, to_status="placed", actor_role="system", visibility="customer"
    )
    internal = OrderStatusEvent(
        order_id=order.id,
        from_status="placed",
        to_status="placed",
        actor_role="system",
        visibility="internal",
        note="internal note",
    )
    await flush(session, item, placed, internal)
    return order


async def insert_notification(
    session: AsyncSession,
    *,
    dedupe_key: str,
    payload: dict[str, Any],
    recipient: uuid.UUID | None = None,
    destination: str | None = None,
    lane: str = "transactional",
    returning: bool = False,
) -> uuid.UUID:
    """Core insert without RETURNING (the only way request actors write the outbox)."""
    row = Notification(channel="email", purpose="test", lane=lane, dedupe_key=dedupe_key)
    row.id = new_id()
    row.recipient_user_id = recipient
    row.payload = payload
    if destination is not None:
        row.destination = destination
    stmt = insert(Notification.__table__).values(column_values(row))
    if returning:
        stmt = stmt.returning(Notification.__table__.c.id)
    await session.execute(stmt)
    return row.id


async def insert_audit(session: AsyncSession, *, action: str, **values: Any) -> None:
    await session.execute(
        insert(AuditLog.__table__).inline().values(action=action, outcome="success", **values)
    )


@dataclass
class World:
    ids: dict[str, uuid.UUID] = field(default_factory=dict)
    orders: dict[str, uuid.UUID] = field(default_factory=dict)
    plaintexts: list[str] = field(default_factory=list)

    def remember(self, *values: str) -> None:
        self.plaintexts.extend(values)


def _phone(n: int) -> str:
    return f"+91 98765 {n:05d}"


async def build_world(session: AsyncSession) -> World:
    """C1, C2 customers · S1, S2 approved sellers · S3 pending · S4 suspended grant · A admin,
    plus at least one row per owner in every RLS table (see tests/security/test_rls.py)."""
    w = World()
    people: dict[str, User] = {}
    for key, n in (("C1", 11), ("C2", 12)):
        email, phone = f"{key.lower()}.plaintext.probe@example.test", _phone(n)
        people[key] = await create_user(
            session, full_name=f"Customer {key}", email=email, phone=phone
        )
        w.remember(email, phone, phone.replace(" ", "").removeprefix("+91"))
    sellers = (
        ("S1", "active", 71),
        ("S2", "active", 72),
        ("S3", "pending", 73),
        ("S4", "suspended", 74),
    )
    for key, grant, n in sellers:
        email = f"{key.lower()}.plaintext.probe@example.test"
        people[key] = await create_seller(
            session,
            name=f"Seller {key}",
            email=email,
            slug=f"shop-{key.lower()}",
            grant_status=grant,
            whatsapp=_phone(n),
        )
        w.remember(email, _phone(n))
    people["A"] = await create_user(
        session,
        full_name="Admin A",
        email="a.plaintext.probe@example.test",
        roles={"customer": "active", "admin": "active"},
    )
    people["A"].mfa_totp_secret = "totp seed plaintext probe"
    w.remember("a.plaintext.probe@example.test", "totp seed plaintext probe")
    await session.flush()
    for key, user in people.items():
        w.ids[key] = user.id
    c1, c2, s1, s2, admin = (people[k] for k in ("C1", "C2", "S1", "S2", "A"))

    # identity side tables
    identity = OAuthIdentity(user_id=c1.id, provider="google", subject="google-sub-c1")
    identity.email_at_link = "c1.google.link.probe@example.test"
    identity_s1 = OAuthIdentity(user_id=s1.id, provider="google", subject="google-sub-s1")
    identity_s1.email_at_link = "s1.google.link.probe@example.test"
    w.remember("c1.google.link.probe@example.test", "s1.google.link.probe@example.test")
    expiry = now() + timedelta(days=7)
    sessions = [
        Session(
            user_id=u.id,
            token_hash=hash_token(new_token()),
            active_role=role,
            idle_expires_at=expiry,
            absolute_expires_at=expiry,
            ip_hmac=blind_index("ip", "203.0.113.7"),
        )
        for u, role in ((c1, "customer"), (s1, "seller"), (admin, "admin"))
    ]
    addresses = []
    for u, n in ((c1, 1), (c2, 2), (s1, 3)):
        address = Address(user_id=u.id, city="Vadodara", state="Gujarat", pincode="390001")
        address.recipient_name = f"Recipient probe {n}"
        address.phone = _phone(20 + n)
        address.address = {"house": f"{n}7 Probe Villa", "street": "Alkapuri Probe Road"}
        addresses.append(address)
        w.remember(
            f"Recipient probe {n}", _phone(20 + n), f"{n}7 Probe Villa", "Alkapuri Probe Road"
        )
    invitation = AdminInvitation(
        token_hash=hash_token(new_token()), invited_by=admin.id, expires_at=expiry
    )
    invitation.email = "invitee.probe@example.test"
    blocked = BlockedIdentifier(
        kind="email",
        value_bidx=blind_index("email", "blocked.probe@example.test"),
        blocked_by=admin.id,
    )
    transaction_row = OAuthTransaction(
        state_hash=hash_token(new_token()),
        browser_binding_hash=hash_token(new_token()),
        nonce_hash=hash_token(new_token()),
        intent="login",
        requested_role="customer",
        expires_at=expiry,
    )
    transaction_row.code_verifier = "pkce-verifier-probe-value"
    pending = PendingSignup(
        token_hash=hash_token(new_token()),
        provider="google",
        subject="google-sub-new",
        requested_role="customer",
        expires_at=expiry,
    )
    pending.profile = {"email": "pending.probe@example.test", "name": "Pending Probe"}
    challenge = VerificationChallenge(
        purpose="phone_verify",
        user_id=c1.id,
        code_hmac=code_hmac("challenge", "123456"),
        expires_at=expiry,
    )
    challenge.target = _phone(31)
    token = OneTimeToken(
        purpose="password_reset",
        user_id=c1.id,
        token_hash=hash_token(new_token()),
        expires_at=expiry,
    )
    recovery = MfaRecoveryCode(user_id=admin.id, code_hash="argon2-hash-placeholder")
    bucket = RateLimitBucket(key="login:ip:x", window_start=now(), count=1)
    w.remember(
        "invitee.probe@example.test",
        "pkce-verifier-probe-value",
        "pending.probe@example.test",
        _phone(31),
    )
    await flush(
        session,
        identity,
        identity_s1,
        *sessions,
        *addresses,
        invitation,
        blocked,
        transaction_row,
        pending,
        challenge,
        token,
        recovery,
        bucket,
    )

    # catalog, wishlist, cart
    category = Category(slug="keychain", name="Keychains")
    await flush(session, category)
    p1 = await create_product(session, seller=s1, category=category, sku="kc-probe-one")
    p2 = await create_product(session, seller=s2, category=category, sku="kc-probe-two")
    w.ids["P1"], w.ids["P2"] = p1.id, p2.id
    await flush(
        session,
        WishlistItem(user_id=c1.id, product_id=p1.id),
        WishlistItem(user_id=c2.id, product_id=p2.id),
        WishlistItem(user_id=s1.id, product_id=p2.id),
        CartItem(user_id=c1.id, product_id=p1.id, quantity=1),
        CartItem(user_id=c2.id, product_id=p2.id, quantity=2),
        CartItem(user_id=s1.id, product_id=p2.id, quantity=1),
    )

    # legacy
    batch = LegacyImportBatch(
        file_sha256=hashlib.sha256(b"legacy.csv").digest(), operator="tests", dry_run=False
    )
    await flush(session, batch)
    legacy = LegacyCustomer(
        legacy_ref="LC-1", full_name="Legacy Customer", import_batch_id=batch.id
    )
    legacy.email = "legacy.probe@example.test"
    legacy.phone = _phone(41)
    legacy.notes = "Legacy note probe: prefers evening delivery"
    await flush(session, legacy)
    w.ids["LC1"] = legacy.id
    w.remember(
        "legacy.probe@example.test", _phone(41), "Legacy note probe: prefers evening delivery"
    )

    # commerce
    coupon = Coupon(code="BLOOM10", type="percentage", value=10)
    await flush(session, coupon)
    for key, customer, seller, product, n in (
        ("O1", c1, s1, p1, 1),
        ("O2", c1, s2, p2, 2),
        ("O3", c2, s2, p2, 3),
        ("OL", None, s1, p1, 4),
    ):
        contact = {
            "name": f"Contact probe {n}",
            "phone": _phone(50 + n),
            "email": f"order{n}.contact.probe@example.test",
            "area": f"Probe Area {n}",
            "note": f"Leave with probe guard {n}",
            "gift": f"Happy birthday probe {n}",
            "upi": f"UPIPROBE{n}0001",
        }
        order = await create_order(
            session,
            seller=seller,
            product=product,
            customer=customer,
            legacy_customer=legacy if customer is None else None,
            contact=contact,
        )
        w.orders[key] = order.id
        w.remember(*contact.values(), _phone(50 + n).replace(" ", "").removeprefix("+91"))
    await flush(
        session,
        CouponRedemption(
            coupon_id=coupon.id, user_id=c1.id, checkout_id=new_id(), discount_paise=2800
        ),
        CouponRedemption(
            coupon_id=coupon.id, user_id=c2.id, checkout_id=new_id(), discount_paise=2800
        ),
    )
    for u, n in ((c1, 1), (c2, 2)):
        record = IdempotencyRecord(
            user_id=u.id,
            scope="checkout",
            key=f"idem-{n}",
            request_hash=hashlib.sha256(b"req").digest(),
            state="completed",
            response_status=201,
            expires_at=now() + timedelta(hours=24),
        )
        record.response_body = {"contactEmail": f"idem{n}.response.probe@example.test"}
        await flush(session, record)
        w.remember(f"idem{n}.response.probe@example.test")

    # custom requests
    for key, customer, seller, n in (("CR1", c1, s1, 1), ("CR2", c2, s2, 2)):
        request = CustomRequest(
            request_number=new_reference("CR", 2026),
            customer_id=customer.id,
            assigned_seller_id=seller.id,
            item_type="bouquet",
            description="Pastel tulip bouquet",
            quantity=1,
        )
        request.contact = {"phone": _phone(60 + n), "email": f"cr{n}.contact.probe@example.test"}
        await flush(session, request)
        await flush(
            session,
            CustomRequestImage(
                custom_request_id=request.id,
                position=1,
                storage_key=f"private/{secrets.token_hex(8)}.webp",
                mime="image/webp",
                size_bytes=1000,
                width=10,
                height=10,
                sha256=hashlib.sha256(key.encode()).digest(),
            ),
        )
        w.ids[key] = request.id
        w.remember(_phone(60 + n), f"cr{n}.contact.probe@example.test")

    # outbox, settings, audit
    await insert_notification(
        session,
        dedupe_key="world:c1",
        recipient=c1.id,
        payload={"firstName": "Customer", "otp": "notification payload probe"},
    )
    await insert_notification(
        session,
        dedupe_key="world:s1",
        destination="outbox.destination.probe@example.test",
        payload={"orderNumber": "BC-2026-PROBE1"},
    )
    w.remember("notification payload probe", "outbox.destination.probe@example.test")
    await flush(session, StoreSettings(id=1, config={"storeOpen": True}))
    await insert_audit(session, action="world.built", actor_role="system")
    await insert_audit(session, action="world.checked", actor_role="system")
    return w
