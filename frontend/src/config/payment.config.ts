import type { Coupon } from '../types';

export const GIFT_WRAP_PRICE_PAISE = 4000; // ₹40 for premium kraft gift box with silk ribbon

export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'BLOOM10',
    type: 'percentage',
    discountValue: 10, // 10% off
    minOrderPaise: 40000, // min ₹400
    description: '10% off on handmade orders above ₹400',
  },
  {
    code: 'WELCOME50',
    type: 'flat',
    discountValue: 5000, // ₹50 off (5000 paise)
    minOrderPaise: 30000, // min ₹300
    description: 'Flat ₹50 welcome discount for your first crochet piece',
  },
  {
    code: 'VALENTINE15',
    type: 'percentage',
    discountValue: 15,
    minOrderPaise: 60000,
    description: '15% special celebration discount on bouquets & charms',
  },
];
