import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Publication, Currency, Prisma } from '@prisma/client';

@Injectable()
export class PublicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page: number; limit: number }): Promise<{ items: Publication[]; total: number }> {
    const where: Prisma.PublicationWhereInput = { status: 'ACTIVE' };
    const [items, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        include: { seller: true, source: true, location: true, images: true },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.publication.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Publication | null> {
    return this.prisma.publication.findFirst({
      where: { id, status: { not: 'DELETED' } },
      include: { seller: true, source: true, location: true, images: true, product: true },
    });
  }

  async create(data: Prisma.PublicationCreateInput): Promise<Publication> {
    return this.prisma.publication.create({
      data,
      include: { seller: true, source: true, location: true, images: true },
    });
  }

  async update(id: string, data: Prisma.PublicationUpdateInput): Promise<Publication> {
    return this.prisma.publication.update({
      where: { id },
      data,
      include: { seller: true, source: true, location: true, images: true },
    });
  }

  async appendPriceHistory(publicationId: string, price: number, currency: string, capturedAt: Date): Promise<void> {
    await this.prisma.priceHistory.create({
      data: {
        publicationId,
        price,
        currency: currency as Currency,
        capturedAt,
      },
    });
  }
}
