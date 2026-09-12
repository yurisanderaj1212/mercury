import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Seller, Prisma } from '@prisma/client';

@Injectable()
export class SellersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find seller by phone or name. Used for deduplication during ingestion.
   */
  async findByPhoneOrName(phone: string | null, name: string): Promise<Seller | null> {
    if (phone) {
      const byPhone = await this.prisma.seller.findFirst({ where: { phone } });
      if (byPhone) return byPhone;
    }
    return this.prisma.seller.findFirst({ where: { name } });
  }

  async findById(id: string): Promise<Seller | null> {
    return this.prisma.seller.findUnique({ where: { id } });
  }

  async create(data: Prisma.SellerCreateInput): Promise<Seller> {
    return this.prisma.seller.create({ data });
  }

  /**
   * Find or create a seller by phone/name — used during publication ingestion.
   */
  async findOrCreate(data: { name: string; phone?: string }): Promise<Seller> {
    const existing = await this.findByPhoneOrName(data.phone ?? null, data.name);
    if (existing) return existing;
    return this.prisma.seller.create({ data });
  }
}
