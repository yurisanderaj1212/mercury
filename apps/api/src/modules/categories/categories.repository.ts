import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoots(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { parentCategoryId: null },
      orderBy: { name: 'asc' },
    });
  }

  async findChildren(parentId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { parentCategoryId: parentId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { parentCategoryId: id },
    });
    return count > 0;
  }

  async existsByNameAndParent(name: string, parentCategoryId: string | null): Promise<boolean> {
    const existing = await this.prisma.category.findFirst({
      where: {
        name,
        parentCategoryId: parentCategoryId ?? null,
      },
    });
    return !!existing;
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async countChildren(parentId: string): Promise<number> {
    return this.prisma.category.count({ where: { parentCategoryId: parentId } });
  }
}
