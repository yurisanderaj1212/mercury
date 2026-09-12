import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { CategoriesRepository } from '../categories/categories.repository';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from './dto/product.dto';
import { ProductWithDetails } from './products.repository';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  items: ProductResponseDto[];
  meta: PaginationMeta;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepo: ProductsRepository,
    private readonly categoriesRepo: CategoriesRepository,
  ) {}

  async list(params: { categoryId?: string; page?: number; limit?: number }): Promise<ProductListResponse> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 50);

    const { items, total } = await this.productsRepo.findAll({
      categoryId: params.categoryId,
      page,
      limit,
    });

    return {
      items: items.map(this.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDetail(id: string): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findById(id);
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    return this.toResponse(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    // Rule: categoryId must be a leaf category (no children)
    const isLeaf = !(await this.categoriesRepo.hasChildren(dto.categoryId));
    if (!isLeaf) {
      throw new BadRequestException('CATEGORY_NOT_LEAF');
    }

    const category = await this.categoriesRepo.findById(dto.categoryId);
    if (!category) throw new NotFoundException('CATEGORY_NOT_FOUND');

    // Check unique slug
    const existing = await this.productsRepo.findBySlug(dto.slug);
    if (existing) throw new ConflictException('PRODUCT_SLUG_DUPLICATE');

    const product = await this.productsRepo.create({
      name: dto.name,
      description: dto.description,
      slug: dto.slug,
      category: { connect: { id: dto.categoryId } },
      ...(dto.brandId && { brand: { connect: { id: dto.brandId } } }),
    });

    return this.toResponse(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsRepo.findById(id);
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');

    const updated = await this.productsRepo.update(id, {
      name: dto.name,
      description: dto.description,
      ...(dto.brandId && { brand: { connect: { id: dto.brandId } } }),
    });

    return this.toResponse(updated);
  }

  async deactivate(id: string): Promise<void> {
    const product = await this.productsRepo.findById(id);
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
    await this.productsRepo.deactivate(id);
  }

  private toResponse(product: ProductWithDetails): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? undefined,
      slug: product.slug,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      brandId: product.brandId ?? undefined,
      brandName: product.brand?.name,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
