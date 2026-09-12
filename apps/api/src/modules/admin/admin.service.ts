import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TokenBlacklistService } from '../auth/token-blacklist.service';
import { PublicationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async listUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role.name,
        status: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async setUserStatus(adminId: string, userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { status } });

      await tx.log.create({
        data: {
          userId: adminId,
          action: status === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
          entity: 'user',
          entityId: userId,
          metadata: { targetUserId: userId, newStatus: status },
        },
      });
    });

    // Invalidate all active tokens for suspended user
    if (status === 'SUSPENDED') {
      this.blacklist.blacklistUser(userId);
    } else {
      this.blacklist.restoreUser(userId);
    }
  }

  async listPublications(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.publication.findMany({
        include: { product: true, seller: true, source: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.publication.count(),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        title: p.title,
        price: Number(p.price),
        currency: p.currency,
        status: p.status,
        productName: p.product.name,
        sellerName: p.seller.name,
        sourceName: p.source.name,
        createdAt: p.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updatePublication(adminId: string, pubId: string, data: { title?: string; description?: string; status?: string }) {
    const pub = await this.prisma.publication.findUnique({ where: { id: pubId } });
    if (!pub) throw new NotFoundException('PUBLICATION_NOT_FOUND');

    await this.prisma.$transaction(async (tx) => {
      await tx.publication.update({
        where: { id: pubId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.status && { status: data.status as PublicationStatus }),
        },
      });
      await tx.log.create({
        data: {
          userId: adminId,
          action: 'UPDATE_PUBLICATION',
          entity: 'publication',
          entityId: pubId,
          metadata: { changes: data },
        },
      });
    });
  }

  async getLogs(page = 1, limit = 50, entity?: string) {
    const skip = (page - 1) * limit;
    const where = entity ? { entity } : {};

    const [items, total] = await Promise.all([
      this.prisma.log.findMany({
        where,
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.log.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
