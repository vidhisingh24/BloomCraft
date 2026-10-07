# Going live with Supabase

BloomCraft keeps products, orders, custom requests and accounts in [Supabase](https://supabase.com)
(PostgreSQL + Auth + Realtime). The free plan is enough for a small shop. Setup takes about 20 minutes.

Everything you need is in [`supabase/`](../supabase):

| File | What it is |
|---|---|
| `migrations/20261007000000_init.sql` | Tables, row-level security, the order functions and realtime |
| `seed.sql` | The product catalogue, the coupons and the maker's admin e-mail |
| `past_orders.sql` | Your 18 real sales from before the website |
| `functions/notify-maker/` | Sends you a Telegram / WhatsApp / e-mail alert for every new order |

---

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Name `bloomcraft`, region **South Asia (Mumbai)**, choose a strong database password (store it in a
   password manager — the website never needs it).

## 2. Create the database

1. **SQL Editor → New query** → paste all of `supabase/migrations/20261007000000_init.sql` → **Run**.
2. Open `supabase/seed.sql`. The first insert is the maker login e-mail
   (`vidhiisingh2403@gmail.com`). Change it if you will sign in with another address, then paste the whole
   file into a new query → **Run**.

3. Paste `supabase/past_orders.sql` into a new query → **Run**. This adds your 18 real sales from before
   the website (Aug–Sep 2026, Google Pay, handed over in Vadodara) so they show in the Maker Studio and its
   totals. Run it **before the first website order**, so new orders continue at `BC-2026-00019`.

Check: **Table Editor → products** shows 32 rows and **orders** shows 18 rows.

## 3. Connect the website

**Project Settings → API** shows the *Project URL* and the *anon / publishable* key. Both are public by
design — row-level security protects the data. **Never** use the `service_role` key in the website.

- Local: create `frontend/.env.local` from `frontend/.env.example` and fill in the two values.
- Vercel: **Project → Settings → Environment Variables** → add `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_ENABLE_GOOGLE_LOGIN` → **Redeploy**.

## 4. Sign-in methods

**Authentication → URL Configuration**
- *Site URL*: your live address, e.g. `https://bloomcraft.vercel.app`
- *Redirect URLs*: add the live address and `http://localhost:5173`

**E-mail + password** (on by default)
- Add your own e-mail sending so confirmation and reset e-mails always arrive: **Authentication → Emails →
  SMTP Settings** (e.g. Gmail: host `smtp.gmail.com`, port `465`, your Gmail + an app password), then raise
  **Authentication → Rate Limits → e-mails per hour** to about 30.

**Google**
1. [Google Cloud Console](https://console.cloud.google.com) → *APIs & Services → Credentials →
   Create credentials → OAuth client ID* → type *Web application*.
2. Authorised redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
3. Copy the client ID and secret into **Supabase → Authentication → Providers → Google** → enable.
4. Set `VITE_ENABLE_GOOGLE_LOGIN="true"`.


People stay signed in on their device until they press *Sign out* — sessions refresh automatically.

## 5. Your maker account

Open the site → **Maker Studio** → sign in with the admin e-mail from step 2 (password or Google). Confirm the e-mail if asked. Any other account is refused by the database, not only by the page.

## 6. Instant new-order alerts

The Maker Studio updates live and plays a chime when an order arrives (press **Turn on new-order alerts**
once to also get system notifications). To be alerted when the site is closed:

1. Pick one or more channels and note their secrets:
   - **Telegram** (free, instant): talk to [@BotFather](https://t.me/BotFather) → `/newbot` → copy the
     token; send your bot a message, then open `https://api.telegram.org/bot<token>/getUpdates` and copy
     `chat.id`.
   - **WhatsApp to yourself** (free): follow [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
     to get an API key for your number.
   - **E-mail**: a [Resend](https://resend.com) API key.
2. Deploy the function (needs Node.js):
   ```bash
   npx supabase login
   npx supabase functions deploy notify-maker --project-ref <your-project-ref>
   ```
3. **Edge Functions → Secrets** (or `npx supabase secrets set ...`):
   `WEBHOOK_SECRET` (any long random text), `SITE_URL`, and the channel secrets —
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` / `CALLMEBOT_PHONE` (e.g. `919316097667`), `CALLMEBOT_APIKEY` /
   `RESEND_API_KEY`, `MAKER_EMAIL`.
4. **Database → Webhooks → Create a new hook**, twice (table `orders`, then `custom_requests`):
   events **Insert**, type **Supabase Edge Functions**, function `notify-maker`, HTTP header
   `x-webhook-secret` = your `WEBHOOK_SECRET`.

Each alert lists the items, total, customer, delivery method and — for UPI — the UTR to check in your bank
app before tapping **Paid ✓** in the studio.

## 7. Security settings (5 minutes, do before launch)

The database already enforces who can see and change what (see *What is protected* below). These switches
in the Supabase dashboard close the remaining gaps:

| Where | Setting |
|---|---|
| Authentication → Providers → Email | **Confirm email** on · **Secure email change** on · minimum password length **8** |
| Authentication → Providers → Email | **Leaked password protection** on (Pro plan) |
| Authentication → Rate Limits | keep the defaults or lower: e-mails / SMS per hour, OTP verifications |
| Authentication → Attack Protection | turn on **CAPTCHA** (Cloudflare Turnstile is free) if you see fake sign-ups |
| Authentication → Sessions | optional: inactivity timeout for extra safety on shared devices |
| Authentication → Multi-Factor | optional: enable TOTP and add it to the maker account |
| Project Settings → API | never share the `service_role` key; rotate it if it ever leaks |
| Database → Backups / Settings | enable Point-in-Time Recovery on paid plans; keep the DB password private |

**What is protected (and tested in `supabase/tests/security_test.sql`)**
- Guests can read the catalogue and call three functions: place an order, track an order with number +
  phone, check one coupon code. They cannot read orders, customers, coupons lists or admin data.
- Customers read only their own orders and can change only their own name.
- Only a *confirmed* account whose e-mail is in `admin_emails` can see all orders, confirm payments, change
  prices or answer custom requests.
- Order totals, coupons and delivery charges are calculated in the database; quantities are capped; each
  UPI reference can be used once; retries never create duplicate orders.
- Rate limits: 8 orders / 5 custom requests per phone per hour, 20 orders / 10 requests per network per
  hour (only a hash of the IP is stored).
- `TRUNCATE` and sequence access are removed from the public API roles (Supabase grants them by default).
- The website sends strict security headers (CSP limited to Supabase and India Post, HSTS, no framing).
  If you put Supabase behind a custom domain, add it to `connect-src` in `frontend/vercel.json`.

Run the database tests locally (needs PostgreSQL 15+ installed):
```bash
bash supabase/tests/run-local.sh            # or: PG_BIN="/c/Program Files/PostgreSQL/18/bin" bash ...
```

## 8. Day-to-day

- **Prices / availability**: Maker Studio → Products (the shop updates immediately).
- **New products, coupons**: Supabase → Table Editor → `products` / `coupons`.
- **Backups**: Supabase → Database → Backups (daily on paid plans; export CSVs from the Table Editor on
  the free plan).
