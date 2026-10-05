# 🌸 BloomCraft

**Handmade crochet keychains, everlasting flower bouquets and custom crochet gifts — made in Vadodara, Gujarat.**

BloomCraft is the online store for a small crochet studio. Customers browse the collection, check out with
local handover, campus delivery or a pan-India parcel, pay directly by UPI, and download a receipt. The maker
manages orders, payments and custom requests from her own dashboard.

📸 Instagram: [@bloomcraftt.co](https://www.instagram.com/bloomcraftt.co/) · 💬 WhatsApp: [+91 93160 97667](https://wa.me/919316097667)

---

## ✨ Features

### For customers
- **Shop** keychains (tulips, daisies, roses, sunflowers and more), bouquets and customised pieces, with
  colour choices, wishlist and cart.
- **Custom orders** — describe an idea and send it straight to the maker on WhatsApp.
- **4-step checkout**
  1. contact details (10-digit Indian mobile, digits only);
  2. delivery — 📍 Vadodara local handover (area, date, time slot), 🏫 college campus delivery (13 Vadodara
     colleges) or 📦 pan-India parcel (PIN code auto-fills city and state; free above ₹999);
  3. payment — **UPI** or **pay on handover**;
  4. review, gift wrap, coupons (`BLOOM10`, `WELCOME50`, `VALENTINE15`) and place order.
- **Real UPI payment** — the official Google Pay QR for ₹85 and ₹100 keychains, or a QR generated for the exact
  total; on phones one tap opens the customer's UPI app with the amount filled in. The customer enters the
  12-digit UPI reference (UTR) and the maker confirms it.
- **Order confirmation, tracking and order history**, plus a **downloadable PDF receipt**.
- Mobile-first design, works on any phone size.

### For the maker
- Dashboard with sales overview, orders (status updates, payment verification by UTR, CSV export), custom
  requests, products and delivery planning.

---

## 🧱 Tech stack

| Part | Built with |
|---|---|
| **Frontend** (`frontend/`) | React 19, TypeScript, Vite, Tailwind CSS 4, lucide icons, jsPDF, qrcode, Vitest |
| **Backend** (`backend/`) — in progress | Python 3.14, FastAPI, SQLAlchemy 2 (async) + asyncpg, PostgreSQL 18, Alembic, argon2id, AES-256-GCM, pytest |
| **Hosting** | Vercel (static frontend) |

The live site currently runs on the frontend's built-in mock API: orders, cart and the maker dashboard are stored
in the browser. The backend below is being built to replace it.

---

## 📁 Project structure

```text
BloomCraft/
├── frontend/          # the website (React + Vite) — this is what gets deployed
│   ├── src/
│   │   ├── components/   # pages: shop, checkout, order, receipt, dashboard, auth, intro…
│   │   ├── config/       # site settings: WhatsApp, UPI ID, Instagram, delivery, coupons
│   │   ├── context/      # cart, wishlist, auth, toasts
│   │   ├── services/     # API layer (mock today, real API later)
│   │   └── utils/        # pricing, validation, WhatsApp messages, receipt PDF
│   ├── public/           # product photos, intro images, UPI QR cards
│   ├── vercel.json       # Vercel hosting config
│   └── netlify.toml      # Netlify alternative
└── backend/           # API + database (FastAPI + PostgreSQL)
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

Settings such as the WhatsApp number or UPI ID can be overridden with `VITE_*` variables — see
[`frontend/.env.example`](frontend/.env.example). The defaults already hold the real values.

### Backend (optional, work in progress)
Requires Python 3.14 (via [uv](https://docs.astral.sh/uv/)), PostgreSQL 18 and Mailpit. Setup, migrations,
seeds and the `bloomcraft` CLI are documented in [`backend/README.md`](backend/README.md).

---

## 🌍 Deploy

The frontend is a static site.

**Vercel (recommended)**
1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project** → import this repository.
3. Set **Root Directory** to `frontend` (Vercel detects Vite; `vercel.json` does the rest).
4. **Deploy**. Every push to `main` redeploys automatically.

**Netlify** — new site from Git, **Base directory** `frontend`; `netlify.toml` handles the rest.

More detail and a pre-launch checklist: [`frontend/README.md`](frontend/README.md#-deploying).

---

## 💳 How UPI payments work

1. At checkout the customer scans the QR (or taps **Pay in my UPI app** on a phone) and pays the exact amount.
2. They enter the 12-digit UPI reference (UTR) shown by their payment app.
3. The order is saved as **awaiting verification**.
4. The maker checks the payment in her bank / Google Pay app and taps **Check UTR → Paid ✓** in the dashboard.

No payment gateway and no fees — money goes directly to the maker's UPI account. The QR codes are real:
every scan is a real payment.

---

## 🔐 Security & quality (backend)

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
