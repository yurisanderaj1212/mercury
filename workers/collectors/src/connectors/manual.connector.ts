import type { SourceConnector } from '../interfaces/source-connector.interface';
import type { RawPublication, NormalizedPublication } from '../interfaces/pipeline.interface';

/**
 * Manual connector — receives publication data via direct API call.
 * Used for manually entering data or testing the pipeline.
 */
export class ManualConnector implements SourceConnector {
  readonly sourceName = 'MANUAL';

  async collect(): Promise<RawPublication[]> {
    // Manual connector doesn't collect — data is pushed directly
    return [];
  }

  async normalize(raw: RawPublication): Promise<NormalizedPublication> {
    const data = raw.rawJson as Record<string, unknown>;

    return {
      title: String(data['title'] ?? ''),
      description: String(data['description'] ?? ''),
      price: {
        amount: this.normalizePrice(String(data['price'] ?? '0')),
        currency: this.normalizeCurrency(String(data['currency'] ?? 'CUP')),
      },
      imageUrls: Array.isArray(data['imageUrls']) ? (data['imageUrls'] as string[]) : [],
      sellerName: String(data['sellerName'] ?? 'Desconocido'),
      sellerPhone: data['sellerPhone'] ? this.normalizePhone(String(data['sellerPhone'])) : undefined,
      locationText: String(data['locationText'] ?? ''),
      originalUrl: String(data['originalUrl'] ?? ''),
      publishedAt: data['publishedAt'] ? new Date(String(data['publishedAt'])) : new Date(),
    };
  }

  async validate(data: NormalizedPublication): Promise<boolean> {
    return (
      data.title.trim().length > 0 &&
      data.price.amount > 0 &&
      data.sellerName.trim().length > 0
    );
  }

  /**
   * Normalize price strings: "25mil" → 25000, "25k" → 25000, "25K" → 25000
   */
  private normalizePrice(raw: string): number {
    const cleaned = raw.toLowerCase().replace(/\s/g, '');
    if (cleaned.endsWith('mil')) return parseFloat(cleaned) * 1000;
    if (cleaned.endsWith('k')) return parseFloat(cleaned) * 1000;
    return parseFloat(cleaned) || 0;
  }

  /**
   * Normalize currency to enum values
   */
  private normalizeCurrency(raw: string): 'CUP' | 'USD' | 'MLC' | 'EUR' {
    const upper = raw.toUpperCase();
    if (['CUP', 'USD', 'MLC', 'EUR'].includes(upper)) {
      return upper as 'CUP' | 'USD' | 'MLC' | 'EUR';
    }
    return 'CUP';
  }

  /**
   * Normalize Cuban phone numbers to +53XXXXXXXX format
   */
  private normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('53') && digits.length === 10) return `+${digits}`;
    if (digits.length === 8) return `+53${digits}`;
    return raw;
  }
}
