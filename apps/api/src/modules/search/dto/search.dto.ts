import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, MinLength, IsOptional, IsUUID, IsNumber,
  IsPositive, Min, Max, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DATE_DESC = 'date_desc',
}

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query (min 2 chars)', example: 'aceite vegetal' })
  @IsString()
  @MinLength(2, { message: 'QUERY_TOO_SHORT' })
  q: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  category?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price_min?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price_max?: number;

  @ApiPropertyOptional({ description: 'Location ID (municipality)' })
  @IsOptional()
  @IsUUID()
  location?: string;

  @ApiPropertyOptional({ enum: ['FACEBOOK', 'REVOLICO', 'MANUAL', 'IMPORT', 'API'] })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DATE_DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sort?: SortOrder;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(50)
  limit?: number;
}

export class SearchResultItemDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() price: number;
  @ApiProperty() currency: string;
  @ApiProperty() productId: string;
  @ApiPropertyOptional() productName?: string;
  @ApiProperty() sellerId: string;
  @ApiPropertyOptional() sellerName?: string;
  @ApiProperty() sourceId: string;
  @ApiPropertyOptional() sourceName?: string;
  @ApiPropertyOptional() locationId?: string;
  @ApiPropertyOptional() municipality?: string;
  @ApiPropertyOptional() publicationUrl?: string;
  @ApiProperty() publicationDate: Date;
  @ApiProperty() createdAt: Date;
}

export class SearchResponseDto {
  @ApiProperty({ type: [SearchResultItemDto] }) items: SearchResultItemDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() totalPages: number;
  @ApiProperty() limit: number;
}
