import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OpportunityDetectionService } from '../prices/opportunity-detection.service';

export interface DashboardData {
  favoritesCount: number;
  recentAlerts: Array<{
    id: string;
    productId: string;
    productName: string;
    triggeredAt: Date | null;
    triggeredPrice: number | null;
    currency: string;
  }>;
  newOpportunities: Array<{
    publicationId: string;
    productId: string;
    price: number;
    currency: string;
    differencePercent: number;
    opportunityScore: number;
  }>;
}

export interface ActivityItem {
  type: string;
  publicationId: string;
  publicationTitle: string;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  createdAt: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly opportunityDetection: OpportunityDetectionService,
  ) {}

  async getDashboard(userId: string): Promise<DashboardData> {
    const [favoritesCount, recentAlerts, favoritedProductIds] = await Promise.all([
      this.prisma.favorite.count({ where: { userId } }),
      this.prisma.alert.findMany({
        where: { userId, status: 'TRIGGERED' },
        include: { product: true },
        orderBy: { triggeredAt: 'desc' },
        take: 5,
      }),
      this.getFavoritedProductIds(userId),
    ]);

    // Find new opportunities (score >= 75) in last 24h for favorited products
    const newOpportunities: DashboardData['newOpportunities'] = [];

    for (const productId of favoritedProductIds.slice(0, 10)) {
      const opportunities = await this.opportunityDetection.detectOpportunities(productId);
      const high = opportunities.filter((o) => o.opportunityScore >= 75);
      newOpportunities.push(...high.map((o) => ({
        publicationId: o.publicationId,
        productId,
        price: o.price,
        currency: o.currency,
        differencePercent: o.differencePercent,
        opportunityScore: o.opportunityScore,
      })));
    }

    return {
      favoritesCount,
      recentAlerts: recentAlerts.map((a) => ({
        id: a.id,
        productId: a.productId,
        productName: a.product.name,
        triggeredAt: a.triggeredAt,
        triggeredPrice: a.triggeredPrice ? Number(a.triggeredPrice) : null,
        currency: a.currency,
      })),
      newOpportunities: newOpportunities.slice(0, 10),
    };
  }

  async getActivity(userId: string): Promise<ActivityItem[]> {
    // New publications in favorited products (last 48h)
    const favoritedProductIds = await this.getFavoritedProductIds(userId);
    if (favoritedProductIds.length === 0) return [];

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const publications = await this.prisma.publication.findMany({
      where: {
        productId: { in: favoritedProductIds },
        status: 'ACTIVE',
        createdAt: { gte: twoDaysAgo },
      },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return publications.map((pub) => ({
      type: 'NEW_PUBLICATION',
      publicationId: pub.id,
      publicationTitle: pub.title,
      productId: pub.productId,
      productName: pub.product.name,
      price: Number(pub.price),
      currency: pub.currency,
      createdAt: pub.createdAt,
    }));
  }

  private async getFavoritedProductIds(userId: string): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { publication: { select: { productId: true } } },
    });
    return [...new Set(favorites.map((f) => f.publication.productId))];
  }
}
