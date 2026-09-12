import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SearchQueryDto, SearchResponseDto, SearchResultItemDto, SortOrder } from './dto/search.dto';

type SearchRow = {
  id: string;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  product_id: string;
  product_name: string;
  seller_id: string;
  seller_name: string;
  source_id: string;
  source_name: string;
  location_id: string | null;
  municipality: string | null;
  publication_url: string | null;
  publication_date: Date;
  created_at: Date;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchQueryDto, userId?: string): Promise<SearchResponseDto> {
    if (dto.price_min !== undefined && dto.price_max !== undefined) {
      if (dto.price_min > dto.price_max) {
        throw new BadRequestException('INVALID_PRICE_RANGE');
      }
    }

    const page = dto.page ?? 1;
    const limit = Math.min(Math.max(dto.limit ?? 20, 10), 50);
    const skip = (page - 1) * limit;

    // Build parameterized WHERE conditions
    const params: unknown[] = [`%${dto.q}%`, dto.q];
    const conditions: string[] = [
      "p.status = 'ACTIVE'",
      `(p.title ILIKE $1 OR p.description ILIKE $1 OR to_tsvector('spanish', p.title || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('spanish', $2))`,
    ];

    let paramIdx = 3;

    if (dto.category) {
      conditions.push(`pr.category_id = $${paramIdx}::uuid`);
      params.push(dto.category);
      paramIdx++;
    }

    if (dto.location) {
      conditions.push(`p.location_id = $${paramIdx}::uuid`);
      params.push(dto.location);
      paramIdx++;
    }

    if (dto.source) {
      conditions.push(`src.name = $${paramIdx}`);
      params.push(dto.source);
      paramIdx++;
    }

    if (dto.price_min !== undefined) {
      conditions.push(`p.price >= $${paramIdx}`);
      params.push(dto.price_min);
      paramIdx++;
    }

    if (dto.price_max !== undefined) {
      conditions.push(`p.price <= $${paramIdx}`);
      params.push(dto.price_max);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');
    const orderBy = this.buildOrderBy(dto.sort ?? SortOrder.DATE_DESC);

    const dataQuery = `
      SELECT 
        p.id, p.title, p.description, p.price::text, p.currency,
        p.product_id, pr.name AS product_name,
        p.seller_id, s.name AS seller_name,
        p.source_id, src.name AS source_name,
        p.location_id, l.municipality,
        p.publication_url, p.publication_date, p.created_at
      FROM publications p
      INNER JOIN products pr ON pr.id = p.product_id
      INNER JOIN sellers s ON s.id = p.seller_id
      INNER JOIN sources src ON src.id = p.source_id
      LEFT JOIN locations l ON l.id = p.location_id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countQuery = `
      SELECT COUNT(*)::text AS count
      FROM publications p
      INNER JOIN products pr ON pr.id = p.product_id
      INNER JOIN sellers s ON s.id = p.seller_id
      INNER JOIN sources src ON src.id = p.source_id
      LEFT JOIN locations l ON l.id = p.location_id
      WHERE ${whereClause}
    `;

    const [results, countResult] = await Promise.all([
      this.prisma.$queryRawUnsafe(dataQuery, ...params) as Promise<SearchRow[]>,
      this.prisma.$queryRawUnsafe(countQuery, ...params) as Promise<Array<{ count: string }>>,
    ]);

    const total = parseInt(countResult[0]?.count ?? '0', 10);

    // Save search history for authenticated users (fire and forget)
    if (userId) {
      void this.prisma.searchHistory.create({
        data: { userId, query: dto.q },
      });
    }

    const items: SearchResultItemDto[] = results.map((r: SearchRow) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      price: parseFloat(r.price),
      currency: r.currency,
      productId: r.product_id,
      productName: r.product_name,
      sellerId: r.seller_id,
      sellerName: r.seller_name,
      sourceId: r.source_id,
      sourceName: r.source_name,
      locationId: r.location_id ?? undefined,
      municipality: r.municipality ?? undefined,
      publicationUrl: r.publication_url ?? undefined,
      publicationDate: r.publication_date,
      createdAt: r.created_at,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private buildOrderBy(sort: SortOrder): string {
    switch (sort) {
      case SortOrder.PRICE_ASC:  return 'p.price ASC';
      case SortOrder.PRICE_DESC: return 'p.price DESC';
      case SortOrder.DATE_DESC:
      default:                   return 'p.created_at DESC';
    }
  }
}
