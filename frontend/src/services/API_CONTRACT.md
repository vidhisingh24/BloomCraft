# BloomCraft REST API Contract (v1)

This specification outlines the future backend endpoints for BloomCraft. Currently, the frontend operates against mock services in `src/services/` with an identical data contract.

---

## 1. Products API

### `GET /api/v1/products`
Retrieves a list of catalog products with optional filtering.

**Query Parameters:**
- `category` (optional): `'keychain' | 'bouquet' | 'other'`
- `keychainType` (optional): `'tulip' | 'daisy' | 'rose' | 'others'`
- `search` (optional): `string`
- `inStockOnly` (optional): `boolean`
- `isCustomizable` (optional): `boolean`
- `minPricePaise` (optional): `number`
- `maxPricePaise` (optional): `number`
- `color` (optional): `string`
- `sortBy` (optional): `'popular' | 'newest' | 'price_asc' | 'price_desc'`

**Response:** `200 OK`
```json
[
  {
    "id": "kc-tulip-pink-duo",
    "slug": "baby-pink-double-tulip-bell-charm",
    "name": "Baby Pink Double Tulip Bell Charm",
    "images": ["/images/keychains/tulip_pink_duo.jpg"],
    "description": "Delicate soft pastel baby pink twin tulip bells...",
    "shortDescription": "Pastel baby pink twin tulip charm",
    "price": 12000,
    "compareAtPrice": 15000,
    "category": "keychain",
    "keychainType": "tulip",
    "tags": ["Pastel Love", "Handmade"],
    "colors": [{ "name": "Baby Pink Duo", "hex": "#FFB6C1" }],
    "availability": "in_stock",
    "stock": 12,
    "maxQtyPerOrder": 5,
    "makingTimeDays": 2,
    "isCustomizable": true,
    "createdAt": "2026-01-10T10:00:00.000Z"
  }
]
```

### `GET /api/v1/products/slug/:slug`
Retrieves a single product by its URL slug.

**Response:** `200 OK` or `404 Not Found`

---

## 2. Orders API

### `POST /api/v1/orders`
Creates a new customer order.

**Request Payload:**
```json
{
  "customer": {
    "name": "Ananya Deshmukh",
    "phone": "9825123456",
    "email": "ananya.d@gmail.com"
  },
  "items": [
    {
      "id": "kc-tulip-pink-duo-pink",
      "productId": "kc-tulip-pink-duo",
      "name": "Baby Pink Double Tulip Bell Charm",
      "image": "/images/keychains/tulip_pink_duo.jpg",
      "quantity": 2,
      "selectedColor": "Baby Pink Duo",
      "customNote": "Initials AD",
      "priceAtAdd": 12000
    }
  ],
  "pricing": {
    "subtotal": 24000,
    "delivery": 0,
    "giftWrap": 4000,
    "discount": 0,
    "total": 28000
  },
  "delivery": {
    "method": "vadodara_local",
    "details": {
      "area": "Alkapuri",
      "preferredDate": "2026-10-01",
      "preferredTimeSlot": "Evening (5:00 PM – 8:30 PM)",
      "message": "Meet near Alkapuri Circle"
    },
    "charge": 0
  },
  "payment": {
    "method": "upi",
    "status": "pending",
    "upiTxnRef": "UPI202610019988"
  },
  "giftWrapRequested": true,
  "giftMessage": "Best wishes!"
}
```

**Response:** `201 Created`
```json
{
  "id": "BC-2026-00125",
  "createdAt": "2026-09-24T18:00:00.000Z",
  "status": "placed",
  "statusHistory": [
    {
      "status": "placed",
      "at": "2026-09-24T18:00:00.000Z",
      "note": "Order placed via Vadodara Local Handover"
    }
  ]
}
```

### `GET /api/v1/orders/:id`
Retrieves order details by Order ID.

### `PATCH /api/v1/orders/:id/status`
Updates order fulfillment status.

**Request Payload:**
```json
{
  "status": "preparing",
  "note": "Yarn work in progress"
}
```

---

## 3. Custom Requests API

### `POST /api/v1/custom-requests`
Submits a custom crochet design request.

**Request Payload:**
```json
{
  "customer": {
    "name": "Sneha Dave",
    "phone": "9824011223",
    "email": "snehadave@gmail.com"
  },
  "itemType": "Custom Bouquet",
  "referenceImages": ["data:image/jpeg;base64,..."],
  "description": "3 baby pink tulips and 2 daisies in Korean wrap",
  "colors": ["Baby Pink", "Lavender"],
  "quantity": 1,
  "budget": { "min": 900, "max": 1400 },
  "neededBy": "2026-10-05",
  "occasion": "Convocation"
}
```

**Response:** `201 Created`
```json
{
  "id": "CUSTOM-BC-001",
  "createdAt": "2026-09-24T18:00:00.000Z",
  "status": "received"
}
```
