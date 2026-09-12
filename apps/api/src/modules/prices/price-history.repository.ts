import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PriceHistory } from '@prisma/client';

@Injectable()
export class PriceHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only insert. NEVER updates or deletes existing records.
   * Enforces: capturedAt >= publication.createdAt
   */
  async append(
    publicationId: string,
    price: number,
    currency: string,
    capturedAt: Date,
  ): Promise<PriceHistory> {
    // Validate temporal invariant: capturedAt >= publication.createdAt
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
      select: { createdAt: true },
    });

    if (!publication) {
      throw new BadRequestException('PUBLICATION_NOT_FOUND');
    }

    if (capturedAt < publication.createdAt) {
      throw new BadRequestException(
        `INVALID_PRICE_HISTORY_TIMESTAMP: capturedAt (${capturedAt.toISOString()}) must be >= publication.createdAt (${publication.createdAt.toISOString()})`,
      );
    }

    return this.prisma.priceHistory.create({
      data: {
        publicationId,
        price,
        currency: currency as PriceHistory['currency'],
        capturedAt,
      },
    });
  }

  async findByPublication(publicationId: string): Promise<PriceHistory[]> {
    return this.prisma.priceHistory.findMany({
      where: { publicationId },
      orderBy: { capturedAt: 'asc' },
    });
  }

  async findLatest(publicationId: string): Promise<PriceHistory | null> {
    return this.prisma.priceHistory.findFirst({
      where: { publicationId },
      orderBy: { capturedAt: 'desc' },
    });
  }
}
