/**
 * Shared domain interfaces for Mercury.
 * Used across apps/api, apps/web, and workers.
 */

export type Currency = 'CUP' | 'USD' | 'MLC' | 'EUR';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface Address {
  province: string;
  municipality: string;
  zone?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ProductSpecification {
  key: string;
  value: string;
  unit?: string;
}

export interface MarketStats {
  productId: string;
  currency: Currency;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  activePublicationsCount: number;
  calculatedAt: Date;
}

export interface Opportunity {
  publicationId: string;
  productId: string;
  price: Money;
  marketAvgPrice: number;
  differencePercent: number;
  opportunityScore: number;
}

export interface DailyPricePoint {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
