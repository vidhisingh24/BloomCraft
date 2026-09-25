import type { Customer, DeliveryMethod } from '../types';

/**
 * Normalizes an Indian phone number to 10 digits.
 * Returns null if invalid.
 */
export function normalizeIndianPhone(rawPhone: string): string | null {
  if (!rawPhone) return null;
  // Remove spaces, hyphens, parentheses, +
  let cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  // Must be 10 digits starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    return {
      isValid: false,
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)',
    };
  }
  return { isValid: true };
}

export function validateEmail(email?: string): { isValid: boolean; error?: string } {
  if (!email || email.trim() === '') return { isValid: true };
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }
  return { isValid: true };
}

export function validatePincode(pincode: string): { isValid: boolean; error?: string } {
  const cleaned = pincode.replace(/\s+/g, '');
  if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid 6-digit Indian PIN code (cannot start with 0)',
    };
  }
  return { isValid: true };
}

export function validateCustomer(customer: Partial<Customer>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const name = customer.name?.trim() || '';
  if (name.length < 2 || name.length > 60) {
    errors.name = 'Full name must be between 2 and 60 characters';
  }

  const phoneRes = validatePhone(customer.phone || '');
  if (!phoneRes.isValid) {
    errors.phone = phoneRes.error || 'Invalid phone number';
  }

  if (customer.email) {
    const emailRes = validateEmail(customer.email);
    if (!emailRes.isValid) {
      errors.email = emailRes.error || 'Invalid email address';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateDelivery(
  method: DeliveryMethod,
  details: any
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (method === 'vadodara_local') {
    if (!details?.area || details.area.trim().length < 2) {
      errors.area = 'Please choose or enter your Vadodara area';
    }
    if (!details?.preferredDate) {
      errors.preferredDate = 'Please select a preferred handover date';
    }
  } else if (method === 'college') {
    if (!details?.collegeName || details.collegeName.trim().length < 2) {
      errors.collegeName = 'Please select or specify your college';
    }
    if (!details?.deliveryPoint || details.deliveryPoint.trim().length < 2) {
      errors.deliveryPoint = 'Please specify campus spot (e.g. Main Gate, Canteen)';
    }
    if (!details?.preferredDate) {
      errors.preferredDate = 'Please choose a preferred delivery date';
    }
  } else if (method === 'parcel') {
    if (!details?.house || details.house.trim().length < 1) {
      errors.house = 'Flat / House number is required';
    }
    if (!details?.street || details.street.trim().length < 2) {
      errors.street = 'Street or locality is required';
    }
    if (!details?.city || details.city.trim().length < 2) {
      errors.city = 'City is required';
    }
    if (!details?.state || details.state.trim().length < 2) {
      errors.state = 'State is required';
    }
    const pinRes = validatePincode(details?.pincode || '');
    if (!pinRes.isValid) {
      errors.pincode = pinRes.error || 'Valid 6-digit PIN code required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
