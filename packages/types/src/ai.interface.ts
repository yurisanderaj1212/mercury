import type { Money, ProductSpecification } from './domain';

export interface ExtractedProductInfo {
  productName?: string;
  brandName?: string;
  price?: Money;
  location?: string;
  sellerPhone?: string;
  quantity?: number;
  attributes?: ProductSpecification[];
  confidence: number;
}

export interface DuplicateResult {
  publicationId: string;
  score: number;
  isDuplicate: boolean;
}

export interface AIProvider {
  extractProductInfo(text: string, imageUrls?: string[]): Promise<ExtractedProductInfo>;
  runOCR(imageUrl: string): Promise<string>;
  classifyProduct(text: string): Promise<{ categoryId: string; confidence: number }>;
  detectDuplicates(
    pubText: string,
    candidates: string[],
  ): Promise<DuplicateResult[]>;
}
