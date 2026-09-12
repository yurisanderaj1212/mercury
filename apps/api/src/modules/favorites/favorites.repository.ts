import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Favorite } from '@prisma/client';

@Injectable()
export class FavoritesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent add — uses upsert to prevent duplicates.
   * Returns HTTP 200 whether it was created or already existed.
   */
  async upsert(userId: string, publicationId: string): Promise<Favorite> {
    return this.prisma.favorite.upsert({
      where: { userId_publicationId: { userId, publicationId } },
      update: {},
      create: { userId, publicationId },
    });
  }

  async remove(userId: string, publicationId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: { userId, publicationId },
    });
  }

  async removeById(id: string, userId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: { id, userId },
    });
  }

  async findByUser(userId: string, page: number, limit: number): Promise<{ items: Favorite[]; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { publication: { include: { product: true, seller: true } } },
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);
    return { items, total };
  }
}
