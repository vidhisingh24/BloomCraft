# 🌸 BloomCraft — Frontend Architecture & Build Specification (v2)

BloomCraft is a handmade crochet brand (keychains, bouquets, and bespoke amigurumi creations) handcrafted with 100% premium milk cotton yarn in **Vadodara, Gujarat**.

---

## 🌟 Key Architecture & Capabilities

1. **Preserved Visual & Animation Assets**:
   - The opening brand intro splash animation (`IntroSplash.tsx` and `BloomcraftIntro/`) is preserved with exact timing, visual sequence, and trigger behavior.
   - All high-resolution original handmade crochet product images in `/public/images/keychains/` are used directly in the catalog without any placeholder replacements.
   - Brand aesthetic (Cream `#FAF8F5`, Rose `#FFE3E8`, Blush `#FFF0F3`, Espresso `#3D272A`, Rosewood `#D96B82`) and typography (Playfair Display, Sacramento) preserved throughout.

2. **Mobile-First Responsive Experience**:
   - Tested across 360px, 390px, 430px, 768px, 1024px, and 1440px viewport breakpoints.
   - Fixed sticky bottom action bar on mobile viewports for effortless single-hand thumb navigation.
   - Minimum 44×44px touch targets with safe-area insets (`env(safe-area-inset-*)`).
   - 2-column mobile product grid, responsive bottom sheets, and slide-in navigation drawers.

3. **Backend-Ready Service Layer (`src/services/`)**:
   - UI components interact strictly with `productService`, `orderService`, and `customRequestService`.
   - All monetary values are strictly represented as **integers in paise** (e.g. ₹120 = `12000` paise) across types and calculators to prevent floating-point rounding errors.
   - Versioned typed `localStorage` wrapper (`bloomcraft:v1:*`) with cross-tab event listeners and JSON schema validation.
   - Complete API contract documentation available in [`src/services/API_CONTRACT.md`](./src/services/API_CONTRACT.md).

4. **Multi-Step Checkout Flow (`/checkout`)**:
   - **Step 1 — Customer Information**: Full name, 10-digit Indian phone (with auto +91 normalization and validation), and optional email.
   - **Step 2 — Delivery Method**:
     - 📍 **Vadodara Local**: Selectable local area chips (Alkapuri, Fatehgunj, Akota, etc.), minimum handover date based on handmade lead time, and time slots.
     - 🏫 **College Delivery**: Searchable Vadodara college directory (MSU, Parul, BVM, Navrachana, etc.), campus handover point, and instructions.
     - 📦 **Pan-India Parcel**: Offline auto pincode-to-city/state detection, full street address, and free delivery threshold logic.
   - **Step 3 — Payment Options**:
     - Direct UPI: Official UPI ID copy, QR code, and mobile `upi://pay` deep link.
     - Cash / Pay on Handover (COD).
   - **Step 4 — Final Review & Order Placement**: Itemized receipt preview, gift box options, discount coupons, and terms confirmation.

5. **Order Confirmation, PDF Receipts & Tracking**:
   - Celebratory confirmation screen with animated confetti petals.
   - Printable & downloadable A4 PDF receipt generator powered by `html2canvas` and `jsPDF` with dedicated `@media print` styling.
   - Real-time order tracker (`/track`) and device order history (`/orders`).
   - One-click WhatsApp message builder with clean formatting and character limits.

6. **Maker Dashboard (`/maker` or Tab)**:
   - Overview metrics, Recent Orders table, Custom Requests management, Product Catalog pricing & stock toggles, and dedicated Delivery Tab.
   - Client-side CSV export of filtered orders for offline fulfillment.
   - Status updates made in the dashboard immediately sync with the customer-facing order tracker via shared storage.

---

## 📁 Directory Structure

```
src/
├── config/             # Central site, delivery, and payment configurations
│   ├── site.config.ts
│   ├── delivery.config.ts
│   └── payment.config.ts
├── types/              # TypeScript interfaces (Product, CartItem, Order, etc.)
│   └── index.ts
├── data/mock/          # Realistic mock data and offline datasets
│   ├── products.ts
│   ├── orders.ts
│   ├── customRequests.ts
│   ├── colleges.ts
│   └── pincodes.ts
├── services/           # Service layer with simulated network latency
│   ├── productService.ts
│   ├── orderService.ts
│   ├── customRequestService.ts
│   ├── storage.ts
│   └── API_CONTRACT.md # Full REST endpoint specification for backend integration
├── store/ / context/   # React Context state management
│   ├── CartContext.tsx
│   ├── WishlistContext.tsx
│   └── ToastContext.tsx
├── utils/              # Pure utilities with 100% Vitest unit test coverage
│   ├── currency.ts     # Integer paise formatters
│   ├── pricing.ts      # Tax, discount, gift wrap & delivery calculations
│   ├── ids.ts          # BC-YYYY-XXXXX & CUSTOM-BC-XXX sequential generators
│   ├── whatsapp.ts     # WhatsApp URL and message builders
│   ├── date.ts         # IST datetime and lead-time date helpers
│   ├── validation.ts   # Indian phone, email, and pincode validators
│   └── analytics.ts    # GA4 / Meta Pixel event dispatchers
├── components/         # Reusable modular UI components
│   ├── checkout/       # Multi-step checkout wizard
│   ├── order/          # Order tracker, confirmation & history
│   ├── receipt/        # PDF & printable receipt view
│   ├── Dashboard/      # Maker management studio
│   ├── policy/         # Legal & policy documentation pages
│   ├── KeychainsPage.tsx
│   ├── BouquetsPage.tsx
│   ├── CustomizePage.tsx
│   ├── CartDrawer.tsx
│   ├── WishlistDrawer.tsx
│   ├── ProductModal.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
└── styles/
    └── index.css       # Tailwind CSS, custom animations, print stylesheet
```

---

## 🚀 Getting Started & Scripts

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
# Install project dependencies
npm install
```

### Development Server
```bash
# Start Vite development server
npm run dev
```

### Running Unit Tests
```bash
# Run Vitest unit tests (pricing, ID generation, validation, WhatsApp messages)
npm test
```

### Production Build
```bash
# Type-check and build optimized production bundle
npm run build
```

---

## 🔌 How to Connect the Backend

When ready to connect a real backend (Node.js/Express, Django, Laravel, Supabase, or Firebase):

1. **Configure Environment Variables**:
   Update `.env` (refer to `.env.example`):
   ```env
   VITE_USE_MOCK_API=false
   VITE_API_BASE_URL=https://api.bloomcraft.in/v1
   ```

2. **Implement API Endpoints**:
   Follow the exact contract defined in [`src/services/API_CONTRACT.md`](./src/services/API_CONTRACT.md):
   - `GET /products` & `GET /products/:slug`
   - `POST /orders` & `GET /orders/:id` & `PATCH /orders/:id/status`
   - `POST /custom-requests` & `GET /custom-requests`

3. **Enable Real Network Requests**:
   Uncomment the `fetch(`${siteConfig.apiBaseUrl}/...`)` blocks in:
   - `src/services/productService.ts`
   - `src/services/orderService.ts`
   - `src/services/customRequestService.ts`

No UI components or state hooks need to be refactored!
