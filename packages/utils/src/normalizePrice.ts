/**
 * Normalize price strings from Cuban market formats to numbers.
 * Examples:
 *   "25mil" → 25000
 *   "25k"   → 25000
 *   "25K"   → 25000
 *   "25.5"  → 25.5
 *   "25,000" → 25000
 */
export function normalizePrice(raw: string | number): number {
  if (typeof raw === 'number') return raw >= 0 ? raw : 0;

  const cleaned = String(raw).trim().toLowerCase().replace(/\s/g, '');

  // Handle "25mil" or "25,000mil" patterns
  if (cleaned.endsWith('mil')) {
    const num = parseFloat(cleaned.replace(',', '.').replace('mil', ''));
    return isNaN(num) || num < 0 ? 0 : num * 1000;
  }

  // Handle "25k" or "25K" patterns
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.replace(',', '.').replace('k', ''));
    return isNaN(num) || num < 0 ? 0 : num * 1000;
  }

  // Remove thousand separators and parse
  const num = parseFloat(cleaned.replace(/,/g, ''));
  return isNaN(num) || num < 0 ? 0 : num;
}
