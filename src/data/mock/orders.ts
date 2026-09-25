import type { Order } from '../../types';
import { MOCK_PRODUCTS } from './products';

const pTulip = MOCK_PRODUCTS.find((p) => p.id === 'kc-tulip-pink-duo')!;
const pSpider = MOCK_PRODUCTS.find((p) => p.id === 'kc-spiderman')!;
const pBouquet = MOCK_PRODUCTS.find((p) => p.id === 'bq-tulips')!;
const pDaisy = MOCK_PRODUCTS.find((p) => p.id === 'kc-daisy-yellow-white')!;

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'BC-2026-00121',
    createdAt: '2026-09-21T11:30:00.000Z',
    customer: {
      name: 'Ananya Deshmukh',
      phone: '9825123456',
      email: 'ananya.d@gmail.com',
    },
    items: [
      {
        id: 'kc-tulip-pink-duo-pink',
        productId: 'kc-tulip-pink-duo',
        product: pTulip,
        name: 'Baby Pink Double Tulip Bell Charm',
        image: '/images/keychains/tulip_pink_duo.jpg',
        quantity: 2,
        selectedColor: 'Baby Pink Duo',
        priceAtAdd: 12000,
      },
      {
        id: 'kc-spiderman-default',
        productId: 'kc-spiderman',
        product: pSpider,
        name: 'Hanging Spider-Man Crochet Charm',
        image: '/images/keychains/spiderman_hanging.jpg',
        quantity: 1,
        selectedColor: 'Classic Red & Blue',
        priceAtAdd: 12000,
      },
    ],
    pricing: {
      subtotal: 36000,
      delivery: 0,
      giftWrap: 4000,
      discount: 0,
      total: 40000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Alkapuri',
        preferredDate: '2026-09-25',
        preferredTimeSlot: 'Evening (5:00 PM – 8:30 PM)',
        message: 'Can meet near Alkapuri Circle or Inorbit Mall',
      },
      charge: 0,
    },
    payment: {
      method: 'upi',
      status: 'paid',
      upiTxnRef: 'UPI20260921789123',
    },
    giftWrapRequested: true,
    giftMessage: 'Happy Birthday to my dearest friend! 🌸',
    status: 'preparing',
    statusHistory: [
      { status: 'placed', at: '2026-09-21T11:30:00.000Z', note: 'Order placed by customer via UPI' },
      { status: 'confirmed', at: '2026-09-21T12:15:00.000Z', note: 'Payment verified & order confirmed by maker' },
      { status: 'preparing', at: '2026-09-22T09:00:00.000Z', note: 'Yarn stitching in progress' },
    ],
  },
  {
    id: 'BC-2026-00122',
    createdAt: '2026-09-22T14:45:00.000Z',
    customer: {
      name: 'Rohan Sharma',
      phone: '9879054321',
      email: 'rohan.msu@yahoo.com',
    },
    items: [
      {
        id: 'bq-tulips-pastel',
        productId: 'bq-tulips',
        product: pBouquet,
        name: 'Pastel Dream Tulip Bouquet',
        image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
        quantity: 1,
        selectedColor: 'Pastel Mix (Pink & Cream)',
        customNote: 'Add tiny pink ribbon bow',
        priceAtAdd: 89900,
      },
    ],
    pricing: {
      subtotal: 89900,
      delivery: 0,
      giftWrap: 0,
      discount: 8990,
      total: 80910,
    },
    delivery: {
      method: 'college',
      details: {
        collegeName: 'MSU - Faculty of Technology & Engineering (Kalabhavan)',
        campus: 'Kalabhavan Campus, Dandia Bazar',
        deliveryPoint: 'Main Gate near Watchman cabin',
        preferredDate: '2026-09-26',
        instructions: 'Call me 10 mins before reaching the gate',
      },
      charge: 0,
    },
    payment: {
      method: 'cod',
      status: 'pending',
    },
    couponCode: 'BLOOM10',
    status: 'confirmed',
    statusHistory: [
      { status: 'placed', at: '2026-09-22T14:45:00.000Z', note: 'Order placed with Campus Delivery' },
      { status: 'confirmed', at: '2026-09-22T16:00:00.000Z', note: 'Campus delivery scheduled' },
    ],
  },
  {
    id: 'BC-2026-00123',
    createdAt: '2026-09-23T10:15:00.000Z',
    customer: {
      name: 'Tanvi Patel',
      phone: '9909988776',
      email: 'tanvi.p@outlook.com',
    },
    items: [
      {
        id: 'kc-daisy-yellow-white-item',
        productId: 'kc-daisy-yellow-white',
        product: pDaisy,
        name: 'Sunny Yellow & White Daisy Charm',
        image: '/images/keychains/daisy_yellow_white.jpg',
        quantity: 2,
        selectedColor: 'Sunny Yellow & White',
        priceAtAdd: 12000,
      },
    ],
    pricing: {
      subtotal: 24000,
      delivery: 6000,
      giftWrap: 0,
      discount: 0,
      total: 30000,
    },
    delivery: {
      method: 'parcel',
      details: {
        house: 'Flat 304, Sunflower Residency',
        street: 'Near Vastrapur Lake',
        area: 'Vastrapur',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        instructions: 'Leave at security desk if unavailable',
      },
      charge: 6000,
    },
    payment: {
      method: 'upi',
      status: 'paid',
      upiTxnRef: 'UPI20260923554433',
    },
    status: 'shipped',
    statusHistory: [
      { status: 'placed', at: '2026-09-23T10:15:00.000Z', note: 'Parcel order placed' },
      { status: 'confirmed', at: '2026-09-23T11:00:00.000Z', note: 'Order confirmed & packaged' },
      { status: 'preparing', at: '2026-09-23T15:00:00.000Z', note: 'Quality check passed & bubble wrapped' },
      { status: 'shipped', at: '2026-09-24T09:30:00.000Z', note: 'Dispatched via Express Courier (AWB: BLUM98234)' },
    ],
  },
];
