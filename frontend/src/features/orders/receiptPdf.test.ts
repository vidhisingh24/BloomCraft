import { describe, expect, it } from 'vitest';
import type { Order } from '../../types';
import { buildReceiptPdf } from './receiptPdf';

const baseOrder: Order = {
  id: 'BC-2026-00001',
  createdAt: '2026-10-07T10:00:00.000Z',
  customer: { name: 'Riya Shah', phone: '9876543210', email: 'riya@example.com' },
  items: [
    { id: 'a', productId: 'kc-tulip-pink-duo', name: 'Baby Pink Double Tulip Bell Charm', image: '/x.jpg', quantity: 2, selectedColor: 'Lavender Duo', customNote: 'Riya 🌸', priceAtAdd: 10000 },
    { id: 'b', productId: 'kc-daisy', name: 'Daisy Charm', image: '/y.jpg', quantity: 1, priceAtAdd: 8500 },
  ],
  pricing: { subtotal: 28500, delivery: 6000, giftWrap: 4000, discount: 0, total: 38500 },
  delivery: {
    method: 'parcel',
    details: { house: '12 A', street: 'MG Road', area: 'Alkapuri', city: 'Vadodara', state: 'Gujarat', pincode: '390007' },
    charge: 6000,
  },
  payment: { method: 'cod', status: 'pending' },
  giftWrapRequested: true,
  giftMessage: 'Happy birthday!',
  status: 'placed',
  statusHistory: [{ status: 'placed', at: '2026-10-07T10:00:00.000Z' }],
};

const deliveryVariants: Order['delivery'][] = [
  baseOrder.delivery,
  { method: 'vadodara_local', details: { area: 'Gotri', preferredDate: '2026-10-10', preferredTimeSlot: 'Morning' }, charge: 0 },
  { method: 'college', details: { collegeName: 'MSU', campus: 'Main', deliveryPoint: 'Gate', preferredDate: '2026-10-11' }, charge: 0 },
];

describe('receipt PDF', () => {
  it('builds a PDF for every delivery method without a DOM snapshot', () => {
    for (const delivery of deliveryVariants) {
      const out = buildReceiptPdf({ ...baseOrder, delivery }).output();
      expect(out.startsWith('%PDF-')).toBe(true);
      expect(out).toContain('ORDER RECEIPT');
      expect(out).toContain(baseOrder.id);
    }
  });

  it('marks paid orders and shows the UTR', () => {
    const order = { ...baseOrder, payment: { method: 'upi' as const, status: 'paid' as const, upiTxnRef: '412345678901' } };
    const out = buildReceiptPdf(order).output();
    expect(out).toContain('PAID');
    expect(out).toContain('412345678901');
  });
});
