import type { Order } from '../../types';
import { MOCK_PRODUCTS } from './products';

const defaultProduct = MOCK_PRODUCTS[0];

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'BC-2026-00001',
    createdAt: '2026-08-27T10:00:00.000Z',
    customer: {
      name: 'Vedanshi',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00001-1',
        productId: 'rakhi-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Rakhi',
        image: '/images/customized/custom-1.jpg',
        quantity: 6,
        priceAtAdd: 41000 / 6,
      },
    ],
    pricing: {
      subtotal: 41000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 41000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-08-27',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260827-01',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-08-27T10:00:00.000Z', note: 'Order placed for 6 Rakhis' },
      { status: 'confirmed', at: '2026-08-27T10:15:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-08-27T18:00:00.000Z', note: 'Completed and delivered (6 Rakhis)' },
    ],
  },
  {
    id: 'BC-2026-00002',
    createdAt: '2026-08-31T11:30:00.000Z',
    customer: {
      name: 'Sanjay Harjani',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00002-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/tulip_magenta_duo.jpg',
        quantity: 7,
        priceAtAdd: 8500,
      },
    ],
    pricing: {
      subtotal: 59500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 59500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-08-31',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260831-02',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-08-31T11:30:00.000Z', note: 'Order placed for 7 Keychains' },
      { status: 'confirmed', at: '2026-08-31T11:45:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-08-31T18:30:00.000Z', note: 'Completed and delivered (7 Keychains)' },
    ],
  },
  {
    id: 'BC-2026-00003',
    createdAt: '2026-09-01T09:15:00.000Z',
    customer: {
      name: 'Prachi Chauhan',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00003-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/daisy_yellow_white.jpg',
        quantity: 1,
        priceAtAdd: 10000,
      },
    ],
    pricing: {
      subtotal: 10000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 10000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-01',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260901-03',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-01T09:15:00.000Z', note: 'Order placed for 1 Keychain' },
      { status: 'confirmed', at: '2026-09-01T09:30:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-01T17:00:00.000Z', note: 'Completed and delivered (1 Keychain)' },
    ],
  },
  {
    id: 'BC-2026-00004',
    createdAt: '2026-09-01T11:45:00.000Z',
    customer: {
      name: 'Manisha Bhrambhatt',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00004-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/tulip_pink_duo.jpg',
        quantity: 1,
        priceAtAdd: 8500,
      },
    ],
    pricing: {
      subtotal: 8500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 8500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-01',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260901-04',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-01T11:45:00.000Z', note: 'Order placed for 1 Keychain' },
      { status: 'confirmed', at: '2026-09-01T12:00:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-01T17:30:00.000Z', note: 'Completed and delivered (1 Keychain)' },
    ],
  },
  {
    id: 'BC-2026-00005',
    createdAt: '2026-09-01T15:30:00.000Z',
    customer: {
      name: 'Omkar Joshi',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00005-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/spiderman_hanging.jpg',
        quantity: 3,
        priceAtAdd: 17500,
      },
    ],
    pricing: {
      subtotal: 52500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 52500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-01',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260901-05',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-01T15:30:00.000Z', note: 'Order placed for 3 Keychains' },
      { status: 'confirmed', at: '2026-09-01T15:45:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-01T19:00:00.000Z', note: 'Completed and delivered (3 Keychains)' },
    ],
  },
  {
    id: 'BC-2026-00006',
    createdAt: '2026-09-02T10:20:00.000Z',
    customer: {
      name: 'Mauli Chauhan',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00006-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/tulip_blue_duo.jpg',
        quantity: 2,
        priceAtAdd: 9250,
      },
    ],
    pricing: {
      subtotal: 18500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 18500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-02',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260902-06',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-02T10:20:00.000Z', note: 'Order placed for 2 Keychains' },
      { status: 'confirmed', at: '2026-09-02T10:35:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-02T17:00:00.000Z', note: 'Completed and delivered (2 Keychains)' },
    ],
  },
  {
    id: 'BC-2026-00007',
    createdAt: '2026-09-02T16:00:00.000Z',
    customer: {
      name: 'Voileta Bhagour',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00007-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/sunflower_orange.jpg',
        quantity: 5,
        priceAtAdd: 9400,
      },
    ],
    pricing: {
      subtotal: 47000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 47000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-02',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260902-07',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-02T16:00:00.000Z', note: 'Order placed for 5 Keychains' },
      { status: 'confirmed', at: '2026-09-02T16:15:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-02T19:30:00.000Z', note: 'Completed and delivered (5 Keychains)' },
    ],
  },
  {
    id: 'BC-2026-00008',
    createdAt: '2026-09-03T11:00:00.000Z',
    customer: {
      name: 'Takshil Barad',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00008-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/daisy_purple_white.jpg',
        quantity: 1,
        priceAtAdd: 10000,
      },
    ],
    pricing: {
      subtotal: 10000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 10000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-03',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260903-08',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-03T11:00:00.000Z', note: 'Order placed for 1 Keychain' },
      { status: 'confirmed', at: '2026-09-03T11:15:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-03T18:00:00.000Z', note: 'Completed and delivered (1 Keychain)' },
    ],
  },
  {
    id: 'BC-2026-00009',
    createdAt: '2026-09-06T14:10:00.000Z',
    customer: {
      name: 'Kashimira Patel',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00009-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/rose_magenta.jpg',
        quantity: 1,
        priceAtAdd: 10000,
      },
    ],
    pricing: {
      subtotal: 10000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 10000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-06',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260906-09',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-06T14:10:00.000Z', note: 'Order placed for 1 Keychain' },
      { status: 'confirmed', at: '2026-09-06T14:25:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-06T19:00:00.000Z', note: 'Completed and delivered (1 Keychain)' },
    ],
  },
  {
    id: 'BC-2026-00010',
    createdAt: '2026-09-10T10:30:00.000Z',
    customer: {
      name: 'Twisha Patel',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00010-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/tulip_lavender_duo.jpg',
        quantity: 1,
        priceAtAdd: 8500,
      },
    ],
    pricing: {
      subtotal: 8500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 8500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-10',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260910-10',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-10T10:30:00.000Z', note: 'Order placed for 1 Keychain' },
      { status: 'confirmed', at: '2026-09-10T10:45:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-10T17:30:00.000Z', note: 'Completed and delivered (1 Keychain)' },
    ],
  },
  {
    id: 'BC-2026-00011',
    createdAt: '2026-09-11T13:45:00.000Z',
    customer: {
      name: 'Bavya Patel',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00011-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/rose_pink.jpg',
        quantity: 3,
        priceAtAdd: 35000,
      },
    ],
    pricing: {
      subtotal: 105000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 105000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-11',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260911-11',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-11T13:45:00.000Z', note: 'Order placed for 3 Keychains' },
      { status: 'confirmed', at: '2026-09-11T14:00:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-11T18:45:00.000Z', note: 'Completed and delivered (3 Keychains)' },
    ],
  },
  {
    id: 'BC-2026-00012',
    createdAt: '2026-09-12T10:15:00.000Z',
    customer: {
      name: 'Rupesh Bhagour',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00012-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/tulip_coral_duo.jpg',
        quantity: 3,
        priceAtAdd: 9500,
      },
    ],
    pricing: {
      subtotal: 28500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 28500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-12',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260912-12',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-12T10:15:00.000Z', note: 'Order placed for 3 Keychains' },
      { status: 'confirmed', at: '2026-09-12T10:30:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-12T16:30:00.000Z', note: 'Completed and delivered (3 Keychains)' },
    ],
  },
  {
    id: 'BC-2026-00013',
    createdAt: '2026-09-12T16:50:00.000Z',
    customer: {
      name: 'Jasmit Singh',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00013-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/daisy_sky_blue.jpg',
        quantity: 1,
        priceAtAdd: 10000,
      },
    ],
    pricing: {
      subtotal: 10000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 10000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-12',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260912-13',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-12T16:50:00.000Z', note: 'Order placed for 1 Keychain' },
      { status: 'confirmed', at: '2026-09-12T17:05:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-12T20:00:00.000Z', note: 'Completed and delivered (1 Keychain)' },
    ],
  },
  {
    id: 'BC-2026-00014',
    createdAt: '2026-09-16T11:20:00.000Z',
    customer: {
      name: 'Niti Chauhan',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00014-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/tulip_white_duo.jpg',
        quantity: 1,
        priceAtAdd: 8500,
      },
    ],
    pricing: {
      subtotal: 8500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 8500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-16',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260916-14',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-16T11:20:00.000Z', note: 'Order placed for 1 Keychain' },
      { status: 'confirmed', at: '2026-09-16T11:35:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-16T18:00:00.000Z', note: 'Completed and delivered (1 Keychain)' },
    ],
  },
  {
    id: 'BC-2026-00015',
    createdAt: '2026-09-19T10:00:00.000Z',
    customer: {
      name: 'Ananya Sharma',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00015-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/daisy_magenta_white.jpg',
        quantity: 2,
        priceAtAdd: 10000,
      },
    ],
    pricing: {
      subtotal: 20000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 20000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-19',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260919-15',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-19T10:00:00.000Z', note: 'Order placed for 2 Keychains' },
      { status: 'confirmed', at: '2026-09-19T10:15:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-19T17:00:00.000Z', note: 'Completed and delivered (2 Keychains)' },
    ],
  },
  {
    id: 'BC-2026-00016',
    createdAt: '2026-09-19T15:30:00.000Z',
    customer: {
      name: 'Harsha Kanjani',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00016-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/tulip_red_duo.jpg',
        quantity: 1,
        priceAtAdd: 15000,
      },
      {
        id: 'item-BC-2026-00016-2',
        productId: 'clip-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Hair Clip',
        image: '/images/customized/custom_maroon_bow_clip.jpg',
        quantity: 1,
        priceAtAdd: 15000,
      },
    ],
    pricing: {
      subtotal: 30000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 30000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-19',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260919-16',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-19T15:30:00.000Z', note: 'Order placed for 1 Keychain & 1 Hair Clip' },
      { status: 'confirmed', at: '2026-09-19T15:45:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-19T19:30:00.000Z', note: 'Completed and delivered (1 Keychain, 1 Hair Clip)' },
    ],
  },
  {
    id: 'BC-2026-00017',
    createdAt: '2026-09-27T12:00:00.000Z',
    customer: {
      name: 'Moksha Yadav',
      phone: '',
    },
    items: [
      {
        id: 'item-BC-2026-00017-1',
        productId: 'kc-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Keychain',
        image: '/images/keychains/daisy_pink_purple.jpg',
        quantity: 1,
        priceAtAdd: 15000,
      },
      {
        id: 'item-BC-2026-00017-2',
        productId: 'waist-chain-handmade',
        product: defaultProduct,
        name: 'Handmade Crochet Waist Chain',
        image: '/images/customized/custom_lace_collar_charm.jpg',
        quantity: 1,
        priceAtAdd: 22000,
      },
    ],
    pricing: {
      subtotal: 37000,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 37000,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-27',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260927-17',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-27T12:00:00.000Z', note: 'Order placed for 1 Keychain & 1 Waist Chain' },
      { status: 'confirmed', at: '2026-09-27T12:15:00.000Z', note: 'Payment verified via Google Pay (G.Pay)' },
      { status: 'delivered', at: '2026-09-27T18:00:00.000Z', note: 'Completed and delivered (1 Keychain, 1 Waist Chain)' },
    ],
  },
  {
    id: 'BC-2026-00018',
    createdAt: '2026-09-28T14:30:00.000Z',
    customer: {
      name: 'Sonal Raj',
      phone: '+91 98765 43210',
    },
    items: [
      {
        id: 'item-BC-2026-00018-1',
        productId: 'kc-evil-eye',
        product: defaultProduct,
        name: 'Evil Eye Keychain',
        image: '/images/keychains/evil_eye_amulet.jpg',
        quantity: 1,
        priceAtAdd: 10000,
      },
      {
        id: 'item-BC-2026-00018-2',
        productId: 'kc-sunflower-brown',
        product: defaultProduct,
        name: 'Sunflower Keychain (Classic Dark Core)',
        image: '/images/keychains/sunflower_brown.jpg',
        quantity: 1,
        priceAtAdd: 8500,
      },
    ],
    pricing: {
      subtotal: 18500,
      delivery: 0,
      giftWrap: 0,
      discount: 0,
      total: 18500,
    },
    delivery: {
      method: 'vadodara_local',
      details: {
        area: 'Vadodara Handover',
        preferredDate: '2026-09-28',
        preferredTimeSlot: 'Completed',
      },
      charge: 0,
    },
    payment: {
      method: 'gpay',
      status: 'paid',
      upiTxnRef: 'GPAY-20260928-18',
    },
    status: 'delivered',
    statusHistory: [
      { status: 'placed', at: '2026-09-28T14:30:00.000Z', note: 'Order placed for 2 Keychains (Evil Eye ₹100 & Sunflower ₹85)' },
      { status: 'confirmed', at: '2026-09-28T14:45:00.000Z', note: 'Payment verified via Google Pay (₹185 received)' },
      { status: 'delivered', at: '2026-09-28T19:00:00.000Z', note: 'Completed and delivered (2 Keychains)' },
    ],
  },
];
