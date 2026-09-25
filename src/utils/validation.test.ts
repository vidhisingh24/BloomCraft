import { describe, it, expect } from 'vitest';
import {
  normalizeIndianPhone,
  validatePhone,
  validateEmail,
  validatePincode,
  validateCustomer,
  validateDelivery,
} from './validation';

describe('Validation utilities', () => {
  describe('normalizeIndianPhone & validatePhone', () => {
    it('validates 10-digit Indian numbers starting with 6,7,8,9', () => {
      expect(normalizeIndianPhone('9876543210')).toBe('9876543210');
      expect(normalizeIndianPhone('+91 98765 43210')).toBe('9876543210');
      expect(normalizeIndianPhone('09123456789')).toBe('9123456789');
      expect(normalizeIndianPhone('+91-88888-88888')).toBe('8888888888');

      expect(validatePhone('9876543210').isValid).toBe(true);
      expect(validatePhone('+91 9876543210').isValid).toBe(true);
    });

    it('rejects invalid numbers', () => {
      expect(normalizeIndianPhone('1234567890')).toBeNull(); // Starts with 1
      expect(normalizeIndianPhone('98765')).toBeNull(); // Too short
      expect(normalizeIndianPhone('abcd123456')).toBeNull();

      expect(validatePhone('12345').isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('allows empty/optional email', () => {
      expect(validateEmail('').isValid).toBe(true);
      expect(validateEmail(undefined).isValid).toBe(true);
    });

    it('validates proper email formats and rejects malformed ones', () => {
      expect(validateEmail('hello@bloomcraft.in').isValid).toBe(true);
      expect(validateEmail('user@gmail.com').isValid).toBe(true);
      expect(validateEmail('invalid-email').isValid).toBe(false);
      expect(validateEmail('user@domain').isValid).toBe(false);
    });
  });

  describe('validatePincode', () => {
    it('accepts 6 digit Indian pincodes not starting with 0', () => {
      expect(validatePincode('390001').isValid).toBe(true);
      expect(validatePincode('390 002').isValid).toBe(true);
      expect(validatePincode('110001').isValid).toBe(true);
    });

    it('rejects invalid pincodes', () => {
      expect(validatePincode('090001').isValid).toBe(false); // Starts with 0
      expect(validatePincode('3900').isValid).toBe(false); // 4 digits
      expect(validatePincode('3900012').isValid).toBe(false); // 7 digits
    });
  });

  describe('validateCustomer', () => {
    it('validates customer payload', () => {
      const valid = validateCustomer({
        name: 'Priya Sharma',
        phone: '9876543210',
        email: 'priya@example.com',
      });
      expect(valid.isValid).toBe(true);
      expect(Object.keys(valid.errors).length).toBe(0);

      const invalid = validateCustomer({
        name: 'P', // Too short
        phone: '12345',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.name).toBeDefined();
      expect(invalid.errors.phone).toBeDefined();
    });
  });

  describe('validateDelivery', () => {
    it('validates Vadodara Local requirements', () => {
      const valid = validateDelivery('vadodara_local', {
        area: 'Alkapuri',
        preferredDate: '2026-10-01',
      });
      expect(valid.isValid).toBe(true);

      const invalid = validateDelivery('vadodara_local', { area: '' });
      expect(invalid.isValid).toBe(false);
    });

    it('validates College Delivery requirements', () => {
      const valid = validateDelivery('college', {
        collegeName: 'MSU Faculty of Technology',
        deliveryPoint: 'Main Gate',
        preferredDate: '2026-10-02',
      });
      expect(valid.isValid).toBe(true);

      const invalid = validateDelivery('college', { collegeName: '' });
      expect(invalid.isValid).toBe(false);
    });

    it('validates Parcel Delivery requirements', () => {
      const valid = validateDelivery('parcel', {
        house: 'Flat 402, Bloom Heights',
        street: 'RC Dutt Road',
        area: 'Alkapuri',
        city: 'Vadodara',
        state: 'Gujarat',
        pincode: '390007',
      });
      expect(valid.isValid).toBe(true);

      const invalid = validateDelivery('parcel', {
        house: '',
        street: '',
        pincode: '000000',
      });
      expect(invalid.isValid).toBe(false);
    });
  });
});
