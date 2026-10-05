/**
 * Date formatting and calculation utilities in IST (Asia/Kolkata)
 */

export function formatISTDate(isoOrDateString?: string | Date): string {
  if (!isoOrDateString) return '';
  const date = typeof isoOrDateString === 'string' ? new Date(isoOrDateString) : isoOrDateString;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatISTDateTime(isoOrDateString?: string | Date): string {
  if (!isoOrDateString) return '';
  const date = typeof isoOrDateString === 'string' ? new Date(isoOrDateString) : isoOrDateString;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Calculates the minimum allowed delivery date based on handmade lead time (makingTimeDays)
 * Format: YYYY-MM-DD for HTML input[type="date"]
 */
export function getMinDeliveryDate(makingTimeDays: number = 2): string {
  const target = new Date();
  target.setDate(target.getDate() + Math.max(1, makingTimeDays));
  const year = target.getFullYear();
  const month = (target.getMonth() + 1).toString().padStart(2, '0');
  const day = target.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given YYYY-MM-DD or date string is before today in IST
 */
export function isDateInPast(dateString: string): boolean {
  if (!dateString) return false;
  const inputDate = new Date(dateString);
  inputDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return inputDate < today;
}
