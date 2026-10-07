import type { Payment } from '../types';

export function paymentMethodLabel(payment: Pick<Payment, 'method' | 'provider'>): string {
  if (payment.method === 'cod') return 'Pay on Handover';
  return payment.provider ? `UPI (${payment.provider})` : 'UPI';
}
