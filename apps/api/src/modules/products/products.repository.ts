import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Product, Category, Brand, Prisma } from '@prisma/client';

export type ProductWithDetails = Product & {
  category: Category;
  brand: Brand | null;
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { categoryId?: string; page: number; limit: number }): Promise<{ items: ProductWithDetails[]; total: number }> {
    const { categoryId, page, limit } = params;
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      ...(categoryId && { categoryId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, brand: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<ProductWithDetails | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true, attributes: true },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { slug } });
  }

  async create(data: Prisma.ProductCreateInput): Promise<ProductWithDetails> {
    return this.prisma.product.create({
      data,
      include: { category: true, brand: true },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<ProductWithDetails> {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true, brand: true },
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
