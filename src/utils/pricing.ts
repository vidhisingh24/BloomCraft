import type { CartItem, Coupon, OrderPricing } from '../types';
import { GIFT_WRAP_PRICE_PAISE } from '../config/payment.config';

export interface PricingOptions {
  giftWrap?: boolean;
  coupon?: Coupon | null;
  deliveryMethod?: 'vadodara_local' | 'college' | 'parcel';
  baseDeliveryCharge?: number;
  freeDeliveryThreshold?: number;
}

/**
 * Pure function to calculate all pricing components in integer paise.
 */
export function calculatePricing(
  items: CartItem[],
  deliveryChargePaise: number = 0,
  options: PricingOptions = {}
): OrderPricing {
  // 1. Calculate subtotal
  const subtotal = items.reduce((acc, item) => {
    const unitPrice = item.priceAtAdd || (item.product ? item.product.price : 0);
    const qty = Math.max(1, item.quantity || 1);
    return acc + Math.round(unitPrice * qty);
  }, 0);

  // 2. Gift wrap calculation
  const giftWrap = options.giftWrap && items.length > 0 ? GIFT_WRAP_PRICE_PAISE : 0;

  // 3. Discount calculation
  let discount = 0;
  if (options.coupon && subtotal > 0) {
    const minRequired = options.coupon.minOrderPaise || 0;
    if (subtotal >= minRequired) {
      if (options.coupon.type === 'percentage') {
        discount = Math.round((subtotal * options.coupon.discountValue) / 100);
      } else if (options.coupon.type === 'flat') {
        discount = Math.min(options.coupon.discountValue, subtotal);
      }
    }
  }

  // 4. Delivery calculation (check free shipping threshold if parcel)
  let delivery = deliveryChargePaise;
  if (
    options.deliveryMethod === 'parcel' &&
    options.freeDeliveryThreshold &&
    subtotal >= options.freeDeliveryThreshold
  ) {
    delivery = 0;
  } else if (items.length === 0) {
    delivery = 0;
  }

  // 5. Total
  const total = Math.max(0, subtotal + delivery + giftWrap - discount);

  return {
    subtotal,
    delivery,
    giftWrap,
    discount,
    total,
  };
}
