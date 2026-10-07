# 🌸 BloomCraft — Frontend

React 19 + TypeScript + Vite + Tailwind CSS 4 storefront and Maker Studio, backed by Supabase
(database, accounts, realtime). Setup of the Supabase project: [`../docs/SUPABASE_SETUP.md`](../docs/SUPABASE_SETUP.md).

## How it works

- **Catalogue** — `products` and `coupons` tables, loaded once per visit (`CatalogContext`).
- **Checkout** — the browser sends only product IDs, quantities, delivery details and the UPI reference
  to the `place_order` database function. The database recomputes every price, coupon and delivery
  charge and refuses the order if the total differs from what the customer saw, or if a UPI reference
  was already used.
- **Accounts** — Supabase Auth (Google or e-mail + password). The
  session is kept on the device and refreshed automatically, so customers stay signed in.
- **Maker Studio** — only the e-mail listed in `admin_emails` can open it; row-level security enforces
  this in the database. New orders and custom requests arrive live (Supabase Realtime) with a chime and
  an optional system notification; an Edge Function can also alert by Telegram / WhatsApp / e-mail.
- **Guests** can order without an account and track an order with its number + phone number.
- Cart, wishlist and the checkout draft stay in the browser (per-device conveniences).

## Folder structure

```text
src/
├── app/App.tsx            # providers, page switching, auth gate
├── features/              # one folder per area of the site
│   ├── auth/              # login pages, AuthForm, password reset
│   ├── shop/              # home, keychains, bouquets, product modal
│   ├── custom/            # custom-order page (saved to the studio + WhatsApp)
│   ├── cart/  wishlist/
│   ├── checkout/          # 4-step checkout, UPI QR + UTR panel
│   ├── orders/            # confirmation, tracking, history, receipt + PDF
│   ├── dashboard/         # Maker Studio (orders, payments, requests, products, delivery)
│   ├── intro/  policy/
├── components/            # shared UI: layout (navbar, footer), social icons, status banners
├── context/               # Auth, Catalog, Cart, Wishlist, Toast providers
├── services/              # Supabase calls: products, orders, custom requests; local storage helper
├── lib/supabase.ts        # Supabase client + friendly error messages
├── config/                # site details, delivery options, gift-wrap price
├── data/                  # static reference data: colleges, PIN codes, custom gallery
├── types/  utils/
```

## Scripts

Requires **Node.js 20.19+** (22 recommended).

| Command | What it does |
|---|---|
| `npm install` | install dependencies |
| `npm run dev` | development server on http://localhost:5173 |
| `npm test` | unit tests (pricing, validation, WhatsApp messages, receipt PDF, UPI) |
| `npm run check` | type-check, lint, tests and production build — run before every deploy |
| `npm run preview` | serve the production build on http://localhost:4173 |

Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
Without them the site shows a short setup notice instead of the shop.

## 🌍 Deploying

### Vercel (recommended)
1. **Add New → Project** on vercel.com and import the GitHub repository.
2. **Root Directory: `frontend`** (Framework preset: Vite — `vercel.json` sets the rest).
3. **Settings → Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_ENABLE_GOOGLE_LOGIN` (and any optional `VITE_*` from
   `.env.example`). `VITE_*` values are baked in at build time — redeploy after changing them.
4. In Supabase → Authentication → URL Configuration, add the Vercel address as Site URL / Redirect URL.

### Netlify
New site from Git → **Base directory `frontend`**; `netlify.toml` sets the build, the SPA fallback and the
headers. Add the same environment variables.

### What the configs do
- every unknown path serves `index.html` (single-page app), so refreshing never shows a 404;
- hashed files in `/assets` are cached for a year, images for a week;
- security headers (CSP allowing Supabase over HTTPS/WebSocket, no framing, nosniff, referrer policy).

### Before you share the link
- `npm run check` passes.
- Place a test order (Pay on Handover) and check it appears in the Maker Studio and in your alerts; then
  set it to *Cancelled*.
- UPI: the QR codes and UPI ID are real — every scan moves real money to that account.
