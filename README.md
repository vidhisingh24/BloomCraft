# 🌸 BloomCraft

**Handmade crochet keychains, everlasting flower bouquets and custom crochet gifts — made in Vadodara, Gujarat.**

BloomCraft is the online store for a small crochet studio. Customers browse the collection, check out with
local handover, campus delivery or a pan-India parcel, pay directly by UPI, and download a receipt. Every
order lands instantly in the maker's dashboard (and on her phone), where she confirms payments and manages
orders, custom requests and products.

📸 Instagram: [@bloomcraftt.co](https://www.instagram.com/bloomcraftt.co/) · 💬 WhatsApp: [+91 93160 97667](https://wa.me/919316097667)

---

## ✨ Features

### For customers
- **Shop** keychains (tulips, daisies, roses, sunflowers and more), bouquets and customised pieces, with
  colour choices, wishlist and cart.
- **Accounts** — Google or e-mail + password; customers stay signed in
  on their device. Guests can order too and track with order number + phone.
- **Custom orders** — describe an idea; it is saved to the maker's dashboard and opened on WhatsApp.
- **4-step checkout**
  1. contact details (10-digit Indian mobile, digits only);
  2. delivery — 📍 Vadodara local handover (area, date, time slot), 🏫 college campus delivery (13 Vadodara
     colleges) or 📦 pan-India parcel (PIN code auto-fills city and state; free above ₹999);
  3. payment — **UPI** or **pay on handover**;
  4. review, gift wrap, coupons and place order.
- **Real UPI payment** — the official Google Pay QR for ₹85 and ₹100 keychains, or a QR generated for the exact
  total; on phones one tap opens the customer's UPI app with the amount filled in. The customer enters the
  12-digit UPI reference (UTR) and the maker confirms it.
- **Order confirmation, tracking and order history** (synced to the account), plus a **downloadable PDF
  receipt**.
- Mobile-first design, works on any phone size.

### For the maker
- **Instant alerts** — new orders and custom requests appear live in the dashboard with a chime and system
  notification, and can also be pushed to Telegram, WhatsApp or e-mail.
- Dashboard with sales & payments overview, orders (status updates, one-tap UTR payment confirmation, CSV
  export), custom requests and quotes, product prices / availability and delivery planning.

---

## 🧱 Tech stack

| Part | Built with |
|---|---|
| **Frontend** (`frontend/`) | React 19, TypeScript, Vite, Tailwind CSS 4, lucide icons, jsPDF, qrcode, Vitest |
| **Database & accounts** (`supabase/`) | Supabase: PostgreSQL with row-level security, Auth, Realtime, an Edge Function for alerts |
| **Hosting** | Vercel (static frontend) + Supabase |
| **Backend API** (`backend/`) — future | Python 3.14, FastAPI, SQLAlchemy 2 (async), PostgreSQL 18, Alembic, argon2id, AES-256-GCM, pytest |

The live site talks to Supabase directly. Prices, coupons and delivery charges are recomputed inside the
database when an order is placed, so the browser cannot change what an order costs.

---

## 📁 Project structure

```text
BloomCraft/
├── frontend/          # the website (React + Vite) — this is what gets deployed
│   ├── src/
│   │   ├── app/          # App shell: providers, page switching, auth gate
│   │   ├── features/     # shop, custom, cart, wishlist, checkout, orders, auth, dashboard, intro, policy
│   │   ├── components/   # shared layout (navbar, footer) and UI pieces
│   │   ├── context/      # auth, catalogue, cart, wishlist, toasts
│   │   ├── services/     # Supabase calls: products, orders, custom requests
│   │   ├── lib/          # Supabase client
│   │   ├── config/       # site settings: WhatsApp, UPI ID, Instagram, delivery
│   │   └── utils/        # pricing, validation, WhatsApp messages
│   ├── public/           # product photos, intro images, UPI QR cards
│   ├── vercel.json       # Vercel hosting config
│   └── netlify.toml      # Netlify alternative
├── supabase/          # database schema, seed data, alert Edge Function
├── docs/              # SUPABASE_SETUP.md — going-live guide
└── backend/           # future API (FastAPI + PostgreSQL)
    ├── app/              # config, security, database models, CLI
    ├── migrations/       # database schema (Alembic)
    ├── seeds/            # categories, coupons, store settings
    └── tests/            # unit, integration and security tests
```

---

## 🚀 Run it locally

### Frontend
Requires **Node.js 20.19+** (22 recommended).

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | development server with hot reload |
| `npm run build` | type-check and build into `dist/` |
| `npm run preview` | serve the production build on http://localhost:4173 |
| `npm test` | run the unit tests |
| `npm run check` | type-check, lint, test and build — run before deploying |

Copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env.local` and add your Supabase URL and
public key. Creating the Supabase project, sign-in providers and order alerts is a 20-minute job:
**[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**.

### Backend API (optional, future)
Requires Python 3.14 (via [uv](https://docs.astral.sh/uv/)), PostgreSQL 18 and Mailpit. Setup, migrations,
seeds and the `bloomcraft` CLI are documented in [`backend/README.md`](backend/README.md).

---

## 🌍 Deploy

The frontend is a static site.

**Vercel (recommended)**
1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project** → import this repository.
3. Set **Root Directory** to `frontend` (Vercel detects Vite; `vercel.json` does the rest).
4. Add the environment variables from `frontend/.env.example` (at least the two Supabase ones).
5. **Deploy**. Every push to `main` redeploys automatically.

**Netlify** — new site from Git, **Base directory** `frontend`; `netlify.toml` handles the rest.

More detail and a pre-launch checklist: [`frontend/README.md`](frontend/README.md#-deploying).

---

## 💳 How UPI payments work

1. At checkout the customer scans the QR (or taps **Pay in my UPI app** on a phone) and pays the exact amount.
2. They enter the 12-digit UPI reference (UTR) shown by their payment app.
3. The order is saved as **awaiting verification** — each UTR can be used for one order only.
4. The maker is alerted instantly (dashboard chime + Telegram / WhatsApp / e-mail) with the amount and UTR.
5. She checks the payment in her bank / Google Pay app and taps **Check UTR → Paid ✓**; the customer sees
   *Paid* on their order and receipt.

No payment gateway and no fees — money goes directly to the maker's UPI account. The QR codes are real:
every scan is a real payment.

---

## 🔐 Security

**Live site (Supabase)**
- Row-level security: customers read only their own orders; only the maker's confirmed e-mail can see all
  orders or change products. Orders can only be created through a checked database function.
- Server-side pricing, quantity limits, UTR re-use check and per-phone rate limits on orders and requests.
- Only the public key ships in the website; secrets for alerts live in Supabase Edge Function secrets.

**Future backend API**
- Row-level security in PostgreSQL: each customer, seller and admin sees only their own rows.
- Personal data (emails, phones, addresses, UPI references) encrypted per column with AES-256-GCM; exact-match
  lookups through HMAC blind indexes.
- Passwords hashed with argon2id plus a pepper, checked against a context-aware password policy.
- Structured logs with automatic redaction of personal data and secrets.
- Quality gate: ruff, mypy `--strict`, ~400 tests with coverage floors, pip-audit and gitleaks.

---

## 🤝 Contact

Made with love by **Vidhi Singh** — orders and custom requests on
[WhatsApp](https://wa.me/919316097667) or [Instagram](https://www.instagram.com/bloomcraftt.co/).
