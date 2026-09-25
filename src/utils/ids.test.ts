import { describe, it, expect } from 'vitest';
import { generateOrderId, generateCustomRequestId } from './ids';

describe('ID Generation utilities', () => {
  it('generates order IDs with format BC-{YEAR}-{5 digits}', () => {
    const orderId = generateOrderId(125);
    const currentYear = new Date().getFullYear();
    expect(orderId).toBe(`BC-${currentYear}-00125`);

    const orderId2 = generateOrderId(9999);
    expect(orderId2).toBe(`BC-${currentYear}-09999`);
  });

  it('generates custom request IDs with format CUSTOM-BC-{3 digits}', () => {
    const customId = generateCustomRequestId(1);
    expect(customId).toBe('CUSTOM-BC-001');

    const customId2 = generateCustomRequestId(42);
    expect(customId2).toBe('CUSTOM-BC-042');
  });
});
