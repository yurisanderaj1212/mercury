import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MarketStatsDto, DailyPricePointDto } from './dto/price.dto';

export interface ExtendedMarketStats extends MarketStatsDto {
  median: number | null;
  stdDev: number | null;
  weeklyChange: number | null;
  monthlyChange: number | null;
}

@Injectable()
export class PriceAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateStats(productId: string, currency = 'CUP'): Promise<ExtendedMarketStats> {
    const publications = await this.prisma.publication.findMany({
      where: { productId, status: 'ACTIVE', currency: currency as 'CUP' | 'USD' | 'MLC' | 'EUR' },
      select: { id: true, price: true },
    });

    if (publications.length === 0) {
      return {
        productId, currency,
        minPrice: null, maxPrice: null, avgPrice: null,
        median: null, stdDev: null,
        weeklyChange: null, monthlyChange: null,
        activePublicationsCount: 0,
        calculatedAt: new Date(),
      };
    }

    const prices = publications.map((p: { id: string; price: unknown }) => Number(p.price)) as number[];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const mean = prices.reduce((s: number, p: number) => s + p, 0) / prices.length;

    const sorted = [...prices].sort((a: number, b: number) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);

    const variance = prices.reduce((s: number, p: number) => s + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Reference price: 60% median + 30% mean + 10% trend
    const referencePrice = median * 0.6 + mean * 0.3 + mean * 0.1;
    const { weeklyChange, monthlyChange } = await this.getPriceChanges(productId, currency, mean);

    return {
      productId, currency,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      avgPrice: Math.round(referencePrice * 100) / 100,
      median: Math.round(median * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100,
      weeklyChange, monthlyChange,
      activePublicationsCount: publications.length,
      calculatedAt: new Date(),
    };
  }

  private async getPriceChanges(
    productId: string,
    currency: string,
    currentAvg: number,
  ): Promise<{ weeklyChange: number | null; monthlyChange: number | null }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weekOld, monthOld] = await Promise.all([
      this.prisma.priceHistory.findFirst({
        where: {
          publication: { productId, currency: currency as 'CUP' | 'USD' | 'MLC' | 'EUR' },
          capturedAt: { lte: weekAgo },
        },
        orderBy: { capturedAt: 'desc' },
        select: { price: true },
      }),
      this.prisma.priceHistory.findFirst({
        where: {
          publication: { productId, currency: currency as 'CUP' | 'USD' | 'MLC' | 'EUR' },
          capturedAt: { lte: monthAgo },
        },
        orderBy: { capturedAt: 'desc' },
        select: { price: true },
      }),
    ]);

    return {
      weeklyChange: weekOld
        ? Math.round(((currentAvg - Number(weekOld.price)) / Number(weekOld.price)) * 10000) / 100
        : null,
      monthlyChange: monthOld
        ? Math.round(((currentAvg - Number(monthOld.price)) / Number(monthOld.price)) * 10000) / 100
        : null,
    };
  }

  async getPriceHistory(productId: string, from: Date, to: Date): Promise<DailyPricePointDto[]> {
    const history = await this.prisma.priceHistory.findMany({
      where: {
        publication: { productId, status: 'ACTIVE' },
        capturedAt: { gte: from, lte: to },
      },
      orderBy: { capturedAt: 'asc' },
      select: { price: true, capturedAt: true },
    });

    const byDay = new Map<string, number[]>();
    for (const entry of history) {
      const day = entry.capturedAt.toISOString().split('T')[0] ?? '';
      const existing = byDay.get(day) ?? [];
      existing.push(Number(entry.price));
      byDay.set(day, existing);
    }

    return Array.from(byDay.entries()).map(([date, dayPrices]) => ({
      date,
      avgPrice: Math.round((dayPrices.reduce((s, p) => s + p, 0) / dayPrices.length) * 100) / 100,
      minPrice: Math.min(...dayPrices),
      maxPrice: Math.max(...dayPrices),
      count: dayPrices.length,
    }));
  }
}
