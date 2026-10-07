import { describe, expect, it } from 'vitest';
import { addressProblem, formatAddress, type AddressInput } from './addressService';

const good: AddressInput = {
  label: 'Home',
  fullName: 'Riya Shah',
  phone: '9876543210',
  house: '12 A, Rose Villa',
  street: 'MG Road',
  area: 'Alkapuri',
  landmark: 'Temple',
  city: 'Vadodara',
  state: 'Gujarat',
  pincode: '390007',
  isDefault: true,
};

describe('addressProblem', () => {
  it('accepts a complete address', () => {
    expect(addressProblem(good)).toBeNull();
  });
  it('names the first missing or invalid field', () => {
    expect(addressProblem({ ...good, fullName: ' ' })).toMatch(/name/);
    expect(addressProblem({ ...good, phone: '12345' })).toMatch(/mobile/);
    expect(addressProblem({ ...good, house: '' })).toMatch(/house/);
    expect(addressProblem({ ...good, pincode: '012345' })).toMatch(/PIN/);
    expect(addressProblem({ ...good, city: '' })).toMatch(/city/);
    expect(addressProblem({ ...good, state: '' })).toMatch(/state/);
  });
});

describe('formatAddress', () => {
  it('joins the parts and skips empty ones', () => {
    expect(formatAddress(good)).toBe('12 A, Rose Villa, MG Road, Alkapuri, near Temple, Vadodara, Gujarat - 390007');
    expect(formatAddress({ ...good, street: undefined, landmark: undefined })).toBe(
      '12 A, Rose Villa, Alkapuri, Vadodara, Gujarat - 390007'
    );
  });
});
