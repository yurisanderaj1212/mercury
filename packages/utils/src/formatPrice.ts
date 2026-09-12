/**
 * Format a price with its currency for display.
 * Example: formatPrice(25000, 'CUP') → "25,000 CUP"
 */
export function formatPrice(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('es-CU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}
