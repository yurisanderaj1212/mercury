/**
 * Convert a string to a URL-safe kebab-case slug.
 * Example: "Aceite Vegetal 20L" → "aceite-vegetal-20l"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // Remove diacritics
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse multiple hyphens
    .replace(/-{2,}/g, '-');
}
