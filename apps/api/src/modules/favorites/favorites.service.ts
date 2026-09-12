import { Injectable } from '@nestjs/common';
import { FavoritesRepository } from './favorites.repository';
import { AddFavoriteDto, FavoriteResponseDto } from './dto/favorite.dto';

interface FavoriteListResponse {
  items: FavoriteResponseDto[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export { FavoriteListResponse };

@Injectable()
export class FavoritesService {
  constructor(private readonly favoritesRepo: FavoritesRepository) {}

  async add(userId: string, dto: AddFavoriteDto): Promise<FavoriteResponseDto> {
    const favorite = await this.favoritesRepo.upsert(userId, dto.publicationId);
    return this.toResponse(favorite);
  }

  async remove(userId: string, publicationId: string): Promise<void> {
    await this.favoritesRepo.remove(userId, publicationId);
  }

  async removeById(userId: string, id: string): Promise<void> {
    await this.favoritesRepo.removeById(id, userId);
  }

  async list(userId: string, page = 1, limit = 20): Promise<FavoriteListResponse> {
    const safeLimit = Math.min(limit, 20);
    const { items, total } = await this.favoritesRepo.findByUser(userId, page, safeLimit);
    return {
      items: items.map(this.toResponse),
      meta: { page, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  private toResponse(favorite: { id: string; userId: string; publicationId: string; createdAt: Date }): FavoriteResponseDto {
    return {
      id: favorite.id,
      userId: favorite.userId,
      publicationId: favorite.publicationId,
      createdAt: favorite.createdAt,
    };
  }
}
