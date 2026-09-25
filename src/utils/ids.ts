const ORDER_COUNTER_KEY = 'bloomcraft:v1:order_seq';
const CUSTOM_COUNTER_KEY = 'bloomcraft:v1:custom_seq';

/**
 * Gets next persisted sequence number safely from localStorage
 */
function getNextSequence(key: string, initialValue: number): number {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : null;
    let nextVal = initialValue;
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= initialValue) {
        nextVal = parsed + 1;
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, nextVal.toString());
    }
    return nextVal;
  } catch {
    return initialValue + Math.floor(Math.random() * 900) + 1;
  }
}

/**
 * Generates an Order ID in the format: BC-{YEAR}-{5-digit sequence} (e.g. BC-2026-00125)
 */
export function generateOrderId(customSeq?: number): string {
  const currentYear = new Date().getFullYear();
  const seq = customSeq !== undefined ? customSeq : getNextSequence(ORDER_COUNTER_KEY, 125);
  const padded = seq.toString().padStart(5, '0');
  return `BC-${currentYear}-${padded}`;
}

/**
 * Generates a Custom Request ID in the format: CUSTOM-BC-{3-digit sequence} (e.g. CUSTOM-BC-001)
 */
export function generateCustomRequestId(customSeq?: number): string {
  const seq = customSeq !== undefined ? customSeq : getNextSequence(CUSTOM_COUNTER_KEY, 1);
  const padded = seq.toString().padStart(3, '0');
  return `CUSTOM-BC-${padded}`;
}
