/**
 * Currency utility functions.
 * All monetary amounts are stored internally as integers in PAISE (1 INR = 100 Paise).
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Converts integer paise into formatted INR string (e.g. 12000 -> ₹120)
 */
export function formatPaise(paise: number): string {
  if (isNaN(paise) || paise === null || paise === undefined) return '₹0';
  const rupees = Math.round(paise) / 100;
  return inrFormatter.format(rupees);
}

/**
 * Converts paise to numeric rupees (e.g. 12000 -> 120)
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise) || !paise) return 0;
  return Math.round(paise) / 100;
}

/**
 * Converts rupees to integer paise (e.g. 120 -> 12000)
 */
export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || !rupees) return 0;
  return Math.round(rupees * 100);
}
