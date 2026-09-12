/**
 * Remove emojis, normalize whitespace, and lowercase.
 */
export function normalizeText(text: string): string {
  return text
    // Remove emojis and other non-standard characters
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Normalize multiple spaces and newlines
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
