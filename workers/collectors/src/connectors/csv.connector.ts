import type { SourceConnector } from '../interfaces/source-connector.interface';
import type { RawPublication, NormalizedPublication } from '../interfaces/pipeline.interface';
import { ManualConnector } from './manual.connector';

/**
 * CSV connector — parses CSV files with publication data.
 * Columns: titulo, descripcion, precio, moneda, telefono_vendedor,
 *          nombre_vendedor, municipio, url_imagen, fecha_publicacion, url_original
 */
export class CsvConnector implements SourceConnector {
  readonly sourceName = 'IMPORT';

  private readonly manualConnector = new ManualConnector();

  /**
   * Parse CSV content and return RawPublications.
   * @param csvContent Raw CSV string
   */
  parseCSV(csvContent: string): RawPublication[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = (lines[0] ?? '').split(',').map((h) => h.trim().toLowerCase());
    const results: RawPublication[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line?.trim()) continue;

      const values = this.parseCsvLine(line);
      const row: Record<string, string> = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() ?? '';
      });

      results.push({
        sourceId: 'IMPORT',
        externalId: `csv-${Date.now()}-${i}`,
        rawJson: {
          title: row['titulo'] ?? row['title'] ?? '',
          description: row['descripcion'] ?? row['description'] ?? '',
          price: row['precio'] ?? row['price'] ?? '0',
          currency: row['moneda'] ?? row['currency'] ?? 'CUP',
          sellerPhone: row['telefono_vendedor'] ?? row['phone'] ?? '',
          sellerName: row['nombre_vendedor'] ?? row['seller'] ?? 'Importado',
          locationText: row['municipio'] ?? row['location'] ?? '',
          imageUrls: row['url_imagen'] ? [row['url_imagen']] : [],
          publishedAt: row['fecha_publicacion'] ?? row['date'] ?? new Date().toISOString(),
          originalUrl: row['url_original'] ?? row['url'] ?? '',
        },
        capturedAt: new Date(),
      });
    }

    return results;
  }

  async collect(): Promise<RawPublication[]> {
    return [];
  }

  async normalize(raw: RawPublication): Promise<NormalizedPublication> {
    return this.manualConnector.normalize(raw);
  }

  async validate(data: NormalizedPublication): Promise<boolean> {
    return this.manualConnector.validate(data);
  }

  /**
   * Parse a single CSV line respecting quoted fields.
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
