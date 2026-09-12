import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Alert, Prisma } from '@prisma/client';

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countActive(userId: string): Promise<number> {
    return this.prisma.alert.count({
      where: { userId, status: 'ACTIVE' },
    });
  }

  async create(data: Prisma.AlertCreateInput): Promise<Alert> {
    return this.prisma.alert.create({ data });
  }

  async findById(id: string): Promise<Alert | null> {
    return this.prisma.alert.findFirst({
      where: { id, status: { not: 'DELETED' } },
    });
  }

  async findByUser(userId: string): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: { userId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
  }

  async update(id: string, data: Prisma.AlertUpdateInput): Promise<Alert> {
    return this.prisma.alert.update({ where: { id }, data });
  }

  async findActiveForProduct(productId: string): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: { productId, status: 'ACTIVE' },
    });
  }
}
