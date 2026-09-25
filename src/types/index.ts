export type Category = 'keychain' | 'bouquet' | 'other';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  images: string[]; // first = primary
  description: string;
  shortDescription: string;
  price: number; // in paise (e.g. 12000 = ₹120)
  compareAtPrice?: number; // in paise
  category: Category;
  keychainType?: 'tulip' | 'daisy' | 'rose' | 'others';
  tags: string[]; // 'Bestseller', 'Handmade', 'New', etc.
  colors: ProductColor[];
  availability: 'in_stock' | 'made_to_order' | 'out_of_stock';
  stock?: number;
  maxQtyPerOrder: number;
  makingTimeDays: number; // handmade lead time in days
  isCustomizable: boolean;
  yarnType?: string;
  dimensions?: string;
  stemsCount?: string;
  createdAt: string; // ISO
}

export interface CartItem {
  id: string; // unique item id (productId + color + customNote)
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  customNote?: string; // e.g. name or initials on keychain (max 30 chars)
  priceAtAdd: number; // in paise snapshot
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
}

export type DeliveryMethod = 'vadodara_local' | 'college' | 'parcel';

export interface VadodaraLocalDetails {
  area: string;
  preferredDate: string;
  preferredTimeSlot: string;
  message?: string;
}

export interface CollegeDetails {
  collegeName: string;
  campus: string;
  deliveryPoint: string;
  preferredDate: string;
  instructions?: string;
}

export interface ParcelDetails {
  house: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
}

export interface Delivery {
  method: DeliveryMethod;
  details: VadodaraLocalDetails | CollegeDetails | ParcelDetails;
  charge: number; // in paise
}

export type PaymentMethod = 'upi' | 'cod';

export interface Payment {
  method: PaymentMethod;
  status: 'pending' | 'awaiting_verification' | 'paid' | 'failed' | 'refunded';
  upiTxnRef?: string;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface StatusHistoryEntry {
  status: OrderStatus;
  at: string; // ISO
  note?: string;
}

export interface OrderPricing {
  subtotal: number; // in paise
  delivery: number; // in paise
  giftWrap: number; // in paise
  discount: number; // in paise
  total: number; // in paise
}

export interface Order {
  id: string; // BC-2026-00125
  createdAt: string; // ISO
  customer: Customer;
  items: (CartItem & { name: string; image: string })[];
  pricing: OrderPricing;
  delivery: Delivery;
  payment: Payment;
  giftWrapRequested?: boolean;
  giftMessage?: string;
  couponCode?: string;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
}

export interface CustomRequest {
  id: string; // CUSTOM-BC-001
  createdAt: string; // ISO
  customer: Customer;
  itemType?: string;
  referenceImages: string[]; // data URLs or image URLs
  description: string;
  colors: string[];
  quantity: number;
  budget: { min?: number; max?: number }; // in ₹
  neededBy?: string;
  occasion?: string;
  status: 'received' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'declined';
  quotedPrice?: number; // in ₹
  notes?: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'flat';
  discountValue: number; // percentage (e.g. 10 for 10%) or paise (e.g. 5000 for ₹50)
  minOrderPaise?: number;
  description: string;
}
