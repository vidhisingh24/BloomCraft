# ADR 0001 — Data protection: actor context, RLS, field encryption

Status: accepted (Phase 2) · Scope: every table in schema `bloomcraft`

## Actor context
- The app connects as `bloomcraft_app` (NOBYPASSRLS). Each transaction starts with
  `app.db.actor.set_actor` → `set_config('bc.actor_id'|'bc.actor_role', …, true)`:
  **transaction-local**, so nothing survives on a pooled connection. `None` sets both to `''`.
- `bloomcraft.actor_role()` / `actor_id()` are **STABLE** SQL functions (IMMUTABLE would be folded
  into cached plans). Unset → `'none'` / NULL → zero rows; a malformed id raises.
- One transaction per unit of work (`app.db.session.transaction`, `get_db`); services never
  commit — a second transaction would run without an actor.
- `system_context(session, reason)` switches to role `system`, logs `reason`, request id and
  the previous role, and restores the previous actor (skipped if the transaction already
  failed). Allowed only for: auth lookups before a session exists, the worker, CLI commands,
  the legacy claim, and revoking another user's sessions. `app/db/actor.py` is the only code
  that touches `bc.actor_*` (a test enforces it).

## RLS matrix (permissive policies `TO bloomcraft_app`, named `<table>_<who>_<command>`)
own = owner column = actor (any signed-in role) · parent = `EXISTS` on the parent (its own
policies apply) · UPDATE's WITH CHECK = USING, so rows can't be handed to someone else.

| Tables | Read | Write |
|---|---|---|
| users, user_roles, seller_profiles, oauth_identities, addresses | own · admin · system | per table (e.g. users insert: system; user_roles insert: own *pending seller application* only) |
| sessions, wishlist_items, cart_items, idempotency_records | own · system | own · system (sessions insert/delete: system) |
| admin_invitations, blocked_identifiers, legacy_customers, legacy_import_batches | admin · system | admin · system (legacy inserts: system) |
| oauth_transactions, pending_signups, verification_challenges, one_time_tokens, mfa_recovery_codes, rate_limit_buckets | system | system |
| orders | customer: `customer_id` · seller: `seller_id` · admin · system | insert: customer (own, `source='web'`) · system |
| order_items, order_status_events, custom_request_images | parent (customers don't see `internal` events) | parent with role customer · system |
| custom_requests | customer: own · seller: assigned · admin · system | customer own · system |
| coupon_redemptions | own · admin · system | customer own · system |
| notifications (outbox) | admin · system | insert: any actor except none |
| audit_log | admin · system | insert: everyone (even no actor) |
| store_settings | everyone | admin · system |
| categories, products, product_images, coupons | no RLS (no personal data) | service rules |

Grants are explicit per table. Never granted: DELETE on users/orders/order_items/
order_status_events/audit_log/coupons, TRUNCATE, REFERENCES, TRIGGER, sequence privileges.
Guard triggers (`BEFORE UPDATE`, SQLSTATE 42501, column name only) stop re-pointing rows that
RLS can't see: orders (seller, number, checkout, source, placed_at, money: system only;
`customer_id`: system, or admin on legacy orders), custom_requests, products.
`storefront_sellers` is a migrator-owned `security_barrier` view (six public columns,
signed-in actors only). `purge_audit_log(days ≥ 365)` is the only SECURITY DEFINER function.

## Write-only tables: RETURNING and ON CONFLICT
PostgreSQL rejects `RETURNING` a row the actor can't SELECT. Outbox and audit rows are
inserted with Core `insert()` and **no RETURNING** (audit: `.inline()`, so SQLAlchemy doesn't
prefetch `nextval()`); the mappers refuse ORM inserts. Outbox dedupe is
`ON CONFLICT DO NOTHING` **without a conflict target** — with a target, SELECT policies apply.

## Field encryption
AES-256-GCM, random 96-bit nonce per value. Blob: `0x01` ‖ key-id length ‖ key id ‖ nonce ‖
ciphertext+tag. AAD = `table|column|row_id` (lowercase UUID): a ciphertext moved to another
row, column or table fails. The row id exists before encryption (`new_id()` client-side).
Encrypted columns are declared once (`app.db.types` descriptors) and listed in
`app.db.registry.ENCRYPTED_COLUMNS`. Keys live only in files → `app.core.config` →
`app.crypto.keyring`; never in the DB, logs or errors (key ids only).

## Blind indexes
HMAC-SHA256(blind-index key, kind ‖ 0x00 ‖ normalised value). Kinds: `email` (NFKC, trim,
lower — also the stored form), `phone` (E.164 via `normalize_indian_mobile`), `google_sub`
(as is), `ip` (canonical). Lookups and uniqueness use blind indexes only; never filter or sort
on ciphertext. Changing a normalisation or the key means recomputing every index.

## Key rotation
1. Add the new key to `backend/secrets/field_keyring.json` and make it `active` (keep the old).
2. Restart the app/worker (new writes use the new key).
3. `uv run --project backend bloomcraft rotate-field-keys --to <new id>` — batches by primary
   key, rows locked `FOR UPDATE`, same AAD; prints counts only. Re-run until it reports
   `0` re-encrypted (writes racing the first run may still carry the old key).
4. Remove the old key from the keyring.
