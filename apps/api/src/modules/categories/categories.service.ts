import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';
import { Category } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepo: CategoriesRepository) {}

  async listRoots(): Promise<CategoryResponseDto[]> {
    const roots = await this.categoriesRepo.findRoots();
    return Promise.all(roots.map((c) => this.toResponse(c)));
  }

  async getChildren(parentId: string): Promise<CategoryResponseDto[]> {
    const parent = await this.categoriesRepo.findById(parentId);
    if (!parent) throw new NotFoundException('CATEGORY_NOT_FOUND');

    const children = await this.categoriesRepo.findChildren(parentId);
    return Promise.all(children.map((c) => this.toResponse(c)));
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Validate unique name at same level
    const duplicate = await this.categoriesRepo.existsByNameAndParent(
      dto.name,
      dto.parentCategoryId ?? null,
    );
    if (duplicate) throw new ConflictException('CATEGORY_NAME_DUPLICATE');

    // Validate parent exists if provided
    if (dto.parentCategoryId) {
      const parent = await this.categoriesRepo.findById(dto.parentCategoryId);
      if (!parent) throw new NotFoundException('PARENT_CATEGORY_NOT_FOUND');
    }

    const category = await this.categoriesRepo.create({
      name: dto.name,
      description: dto.description,
      slug: dto.slug,
      parent: dto.parentCategoryId
        ? { connect: { id: dto.parentCategoryId } }
        : undefined,
    });

    return this.toResponse(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepo.findById(id);
    if (!category) throw new NotFoundException('CATEGORY_NOT_FOUND');

    if (dto.name) {
      const duplicate = await this.categoriesRepo.existsByNameAndParent(
        dto.name,
        category.parentCategoryId,
      );
      if (duplicate && dto.name !== category.name) {
        throw new ConflictException('CATEGORY_NAME_DUPLICATE');
      }
    }

    const updated = await this.categoriesRepo.update(id, {
      name: dto.name,
      description: dto.description,
    });

    return this.toResponse(updated);
  }

  private async toResponse(category: Category): Promise<CategoryResponseDto> {
    const childrenCount = await this.categoriesRepo.countChildren(category.id);
    return {
      id: category.id,
      name: category.name,
      description: category.description ?? undefined,
      slug: category.slug,
      parentCategoryId: category.parentCategoryId ?? undefined,
      childrenCount,
      createdAt: category.createdAt,
    };
  }
}
