import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PublicationsRepository } from './publications.repository';
import { PrismaService } from '../database/prisma.service';
import { CreatePublicationDto, UpdatePublicationDto, PublicationResponseDto } from './dto/publication.dto';
import { Publication } from '@prisma/client';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PublicationListResponse {
  items: PublicationResponseDto[];
  meta: PaginationMeta;
}

@Injectable()
export class PublicationsService {
  constructor(
    private readonly publicationsRepo: PublicationsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(params: { page?: number; limit?: number }): Promise<PublicationListResponse> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 50);
    const { items, total } = await this.publicationsRepo.findAll({ page, limit });
    return {
      items: items.map(this.toResponse),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDetail(id: string): Promise<PublicationResponseDto> {
    const pub = await this.publicationsRepo.findById(id);
    if (!pub || pub.status !== 'ACTIVE') {
      throw new NotFoundException('PUBLICATION_NOT_FOUND');
    }
    return this.toResponse(pub);
  }

  async create(dto: CreatePublicationDto): Promise<PublicationResponseDto> {
    // Validate price is positive with max 2 decimals
    if (dto.price <= 0) throw new BadRequestException('INVALID_PRICE');

    // Ensure seller and source exist (never orphan publication)
    const [seller, source] = await Promise.all([
      this.prisma.seller.findUnique({ where: { id: dto.sellerId } }),
      this.prisma.source.findUnique({ where: { id: dto.sourceId } }),
    ]);

    if (!seller) throw new NotFoundException('SELLER_NOT_FOUND');
    if (!source) throw new NotFoundException('SOURCE_NOT_FOUND');

    // Create publication + price history in a single transaction
    const pub = await this.prisma.$transaction(async (tx) => {
      const created = await tx.publication.create({
        data: {
          productId: dto.productId,
          sellerId: dto.sellerId,
          sourceId: dto.sourceId,
          title: dto.title,
          description: dto.description,
          price: dto.price,
          currency: dto.currency,
          locationId: dto.locationId,
          publicationUrl: dto.publicationUrl,
          publicationDate: new Date(dto.publicationDate),
          status: 'PENDING',
        },
      });

      // Append initial price history entry (append-only, never modify)
      await tx.priceHistory.create({
        data: {
          publicationId: created.id,
          price: dto.price,
          currency: dto.currency,
          capturedAt: new Date(),
        },
      });

      return created;
    });

    return this.toResponse(pub);
  }

  async update(id: string, dto: UpdatePublicationDto): Promise<PublicationResponseDto> {
    const pub = await this.publicationsRepo.findById(id);
    if (!pub) throw new NotFoundException('PUBLICATION_NOT_FOUND');

    const updated = await this.publicationsRepo.update(id, {
      title: dto.title,
      description: dto.description,
      status: dto.status as Publication['status'] | undefined,
    });

    return this.toResponse(updated);
  }

  async deactivate(id: string): Promise<void> {
    const pub = await this.publicationsRepo.findById(id);
    if (!pub) throw new NotFoundException('PUBLICATION_NOT_FOUND');
    await this.publicationsRepo.update(id, { status: 'INACTIVE' });
  }

  private toResponse(pub: Publication): PublicationResponseDto {
    return {
      id: pub.id,
      productId: pub.productId,
      sellerId: pub.sellerId,
      sourceId: pub.sourceId,
      title: pub.title,
      description: pub.description ?? undefined,
      price: Number(pub.price),
      currency: pub.currency,
      locationId: pub.locationId ?? undefined,
      publicationUrl: pub.publicationUrl ?? undefined,
      publicationDate: pub.publicationDate,
      status: pub.status,
      createdAt: pub.createdAt,
      updatedAt: pub.updatedAt,
    };
  }
}
