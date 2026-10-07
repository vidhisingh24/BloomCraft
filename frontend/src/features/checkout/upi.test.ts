import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { OFFICIAL_QR_BY_PAISE, UTR_PATTERN, buildUpiLink } from './upi';

describe('UPI helpers', () => {
  it('builds an NPCI upi:// link with the exact amount', () => {
    const link = buildUpiLink(28000);
    expect(link.startsWith('upi://pay?')).toBe(true);
    expect(link).toContain('am=280.00');
    expect(link).toContain('cu=INR');
  });

  it('uses the store UPI ID', () => {
    expect(buildUpiLink(10000)).toContain('pa=vidhiisingh2403%40okicici');
  });

  it('has an official QR image for the two keychain prices', () => {
    expect(Object.keys(OFFICIAL_QR_BY_PAISE).sort()).toEqual(['10000', '8500']);
    for (const path of Object.values(OFFICIAL_QR_BY_PAISE)) {
      expect(existsSync(resolve(__dirname, '../../../public', path.slice(1)))).toBe(true);
    }
  });

  it('accepts only 12-digit UTRs', () => {
    expect(UTR_PATTERN.test('412345678901')).toBe(true);
    expect(UTR_PATTERN.test('41234567890')).toBe(false);
    expect(UTR_PATTERN.test('41234567890a')).toBe(false);
  });
});
