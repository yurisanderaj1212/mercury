export interface Money {
  amount: number;
  currency: 'CUP' | 'USD' | 'MLC' | 'EUR';
}

export interface RawPublication {
  sourceId: string;
  externalId: string;
  rawJson: Record<string, unknown>;
  capturedAt: Date;
}

export interface NormalizedPublication {
  title: string;
  description: string;
  price: Money;
  imageUrls: string[];
  sellerName: string;
  sellerPhone?: string;
  sellerProfileUrl?: string;
  locationText: string;
  originalUrl: string;
  publishedAt: Date;
}

export interface ProcessingContext {
  rawPublication: RawPublication;
  normalizedData?: NormalizedPublication;
  productId?: string;
  sellerId?: string;
  sourceId?: string;
  isDuplicate?: boolean;
  duplicateScore?: number;
  priceHistoryEntry?: { price: number; currency: string; capturedAt: Date };
  marketStats?: { avgPrice: number | null; activeCount: number };
  errors: string[];
  metadata: Record<string, unknown>;
}

export interface PipelineStage {
  readonly stageName: string;
  readonly enabled: boolean;
  process(ctx: ProcessingContext): Promise<ProcessingContext>;
}
