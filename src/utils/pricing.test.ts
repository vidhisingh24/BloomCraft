import { describe, it, expect } from 'vitest';
import { calculatePricing } from './pricing';
import type { CartItem, Coupon } from '../types';

describe('calculatePricing utility', () => {
  const mockProduct = {
    id: 'kc-tulip-pink-duo',
    slug: 'baby-pink-double-tulip-bell-charm',
    name: 'Baby Pink Double Tulip Bell Charm',
    images: ['/images/keychains/tulip_pink_duo.jpg'],
    description: 'Delicate soft pastel baby pink twin tulip bells.',
    shortDescription: 'Twin tulip charm',
    price: 12000, // ₹120 in paise
    category: 'keychain' as const,
    tags: ['Handmade'],
    colors: [{ name: 'Baby Pink', hex: '#FFB6C1' }],
    availability: 'in_stock' as const,
    maxQtyPerOrder: 5,
    makingTimeDays: 2,
    isCustomizable: true,
    createdAt: new Date().toISOString(),
  };

  const mockItem1: CartItem = {
    id: 'kc-tulip-pink-duo-pink',
    productId: 'kc-tulip-pink-duo',
    product: mockProduct,
    quantity: 2,
    selectedColor: 'Baby Pink',
    priceAtAdd: 12000, // ₹120
  };

  const mockItem2: CartItem = {
    id: 'bq-tulips-pastel',
    productId: 'bq-tulips',
    product: {
      ...mockProduct,
      id: 'bq-tulips',
      price: 89900, // ₹899
    },
    quantity: 1,
    selectedColor: 'Pastel Mix',
    priceAtAdd: 89900,
  };

  it('calculates subtotal correctly for single and multiple items', () => {
    // 2 * 12000 = 24000 paise (₹240)
    const res1 = calculatePricing([mockItem1]);
    expect(res1.subtotal).toBe(24000);
    expect(res1.total).toBe(24000);
    expect(res1.delivery).toBe(0);
    expect(res1.giftWrap).toBe(0);
    expect(res1.discount).toBe(0);

    // 24000 + 89900 = 113900 paise (₹1139)
    const res2 = calculatePricing([mockItem1, mockItem2]);
    expect(res2.subtotal).toBe(113900);
    expect(res2.total).toBe(113900);
  });

  it('handles gift wrapping charge correctly', () => {
    const res = calculatePricing([mockItem1], 0, { giftWrap: true });
    expect(res.giftWrap).toBe(4000); // ₹40
    expect(res.total).toBe(24000 + 4000);
  });

  it('applies percentage coupons correctly when threshold is met', () => {
    const coupon: Coupon = {
      code: 'BLOOM10',
      type: 'percentage',
      discountValue: 10,
      minOrderPaise: 40000, // min ₹400
      description: '10% off',
    };

    // Subtotal ₹240 (< ₹400) -> discount 0
    const resUnder = calculatePricing([mockItem1], 0, { coupon });
    expect(resUnder.discount).toBe(0);

    // Subtotal ₹1139 (>= ₹400) -> discount 10% of 113900 = 11390 paise
    const resOver = calculatePricing([mockItem1, mockItem2], 0, { coupon });
    expect(resOver.discount).toBe(11390);
    expect(resOver.total).toBe(113900 - 11390);
  });

  it('applies flat coupons correctly', () => {
    const coupon: Coupon = {
      code: 'WELCOME50',
      type: 'flat',
      discountValue: 5000, // ₹50
      minOrderPaise: 20000, // min ₹200
      description: 'Flat ₹50',
    };

    const res = calculatePricing([mockItem1], 0, { coupon });
    expect(res.discount).toBe(5000);
    expect(res.total).toBe(24000 - 5000);
  });

  it('handles parcel free delivery threshold', () => {
    // Under ₹999 threshold -> delivery charge applies
    const resUnder = calculatePricing([mockItem1], 6000, {
      deliveryMethod: 'parcel',
      freeDeliveryThreshold: 99900,
    });
    expect(resUnder.delivery).toBe(6000);
    expect(resUnder.total).toBe(24000 + 6000);

    // Over ₹999 threshold -> free delivery (0 charge)
    const resOver = calculatePricing([mockItem1, mockItem2], 6000, {
      deliveryMethod: 'parcel',
      freeDeliveryThreshold: 99900,
    });
    expect(resOver.delivery).toBe(0);
    expect(resOver.total).toBe(113900);
  });

  it('returns zeroes when cart is empty', () => {
    const res = calculatePricing([], 6000, { giftWrap: true });
    expect(res.subtotal).toBe(0);
    expect(res.delivery).toBe(0);
    expect(res.giftWrap).toBe(0);
    expect(res.discount).toBe(0);
    expect(res.total).toBe(0);
  });
});
