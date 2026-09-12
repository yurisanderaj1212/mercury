import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PriceAnalysisService } from './price-analysis.service';
import { OpportunityDto } from './dto/price.dto';

type OpportunityClassification = 'EXCELENTE' | 'BUENA' | 'MEDIA' | 'NO_RECOMENDADA';

@Injectable()
export class OpportunityDetectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceAnalysis: PriceAnalysisService,
  ) {}

  /**
   * Detect opportunities for a product.
   * Opportunities are NEVER stored — calculated dynamically per request.
   */
  async detectOpportunities(productId: string, currency = 'CUP'): Promise<OpportunityDto[]> {
    const stats = await this.priceAnalysis.calculateStats(productId, currency);

    if (!stats.avgPrice || stats.activePublicationsCount === 0) {
      return [];
    }

    const publications = await this.prisma.publication.findMany({
      where: { productId, status: 'ACTIVE', currency: currency as 'CUP' | 'USD' | 'MLC' | 'EUR' },
      include: { seller: true, images: true },
    });

    return publications
      .map((pub) => {
        const price = Number(pub.price);
        const score = this.calculateOpportunityScore(pub, stats.avgPrice!);
        const differencePercent =
          ((price - stats.avgPrice!) / stats.avgPrice!) * 100;

        return {
          publicationId: pub.id,
          price,
          currency: pub.currency,
          marketAvgPrice: stats.avgPrice!,
          differencePercent: Math.round(differencePercent * 100) / 100,
          opportunityScore: score,
          classification: this.classify(score),
        };
      })
      .filter((o) => o.differencePercent < 0) // Only show publications cheaper than average
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  /**
   * Opportunity Score formula (0-100):
   * precio×0.40 + confianza×0.20 + vendedor×0.15 + demanda×0.15 + disponibilidad×0.10
   */
  calculateOpportunityScore(
    pub: { price: unknown; images: unknown[]; seller: { rating: unknown; verified: boolean } },
    marketAvg: number,
  ): number {
    const price = Number(pub.price);

    // Price score (0-40): how much cheaper than market average
    const priceDiff = (marketAvg - price) / marketAvg;
    const priceScore = Math.min(Math.max(priceDiff * 100, 0), 40);

    // Quality score (0-20): based on number of images
    const imageCount = pub.images?.length ?? 0;
    const qualityScore = Math.min(imageCount * 5, 20);

    // Seller score (0-15): based on rating and verification
    const rating = Number(pub.seller?.rating ?? 0);
    const verifiedBonus = pub.seller?.verified ? 5 : 0;
    const sellerScore = Math.min(rating * 2 + verifiedBonus, 15);

    // Demand score (0-15): static 7.5 for MVP (no demand tracking yet)
    const demandScore = 7.5;

    // Availability score (0-10): static 5 for MVP
    const availabilityScore = 5;

    const total = priceScore + qualityScore + sellerScore + demandScore + availabilityScore;
    return Math.round(Math.min(total, 100));
  }

  private classify(score: number): OpportunityClassification {
    if (score >= 90) return 'EXCELENTE';
    if (score >= 75) return 'BUENA';
    if (score >= 50) return 'MEDIA';
    return 'NO_RECOMENDADA';
  }
}
