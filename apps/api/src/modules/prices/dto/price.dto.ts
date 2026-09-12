import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarketStatsDto {
  @ApiProperty() productId: string;
  @ApiProperty() currency: string;
  @ApiPropertyOptional() minPrice: number | null;
  @ApiPropertyOptional() maxPrice: number | null;
  @ApiPropertyOptional() avgPrice: number | null;
  @ApiProperty() activePublicationsCount: number;
  @ApiProperty() calculatedAt: Date;
  @ApiPropertyOptional({ isArray: true }) opportunities?: OpportunityDto[];
}

export class OpportunityDto {
  @ApiProperty() publicationId: string;
  @ApiProperty() price: number;
  @ApiProperty() currency: string;
  @ApiProperty() marketAvgPrice: number;
  @ApiProperty() differencePercent: number;
  @ApiProperty() opportunityScore: number;
  @ApiProperty() classification: string;
}

export class DailyPricePointDto {
  @ApiProperty() date: string;
  @ApiProperty() avgPrice: number;
  @ApiProperty() minPrice: number;
  @ApiProperty() maxPrice: number;
  @ApiProperty() count: number;
}
