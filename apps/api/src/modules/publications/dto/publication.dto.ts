import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber,
  IsPositive, IsEnum, IsUrl, IsDateString, MaxLength, Min,
} from 'class-validator';

export enum CurrencyEnum {
  CUP = 'CUP',
  USD = 'USD',
  MLC = 'MLC',
  EUR = 'EUR',
}

export class CreatePublicationDto {
  @ApiProperty() @IsUUID() productId: string;
  @ApiProperty() @IsUUID() sellerId: string;
  @ApiProperty() @IsUUID() sourceId: string;

  @ApiProperty({ example: 'Vendo Aceite Vegetal 20L' })
  @IsString() @IsNotEmpty() @MaxLength(500)
  title: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 25000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  price: number;

  @ApiProperty({ enum: CurrencyEnum, default: CurrencyEnum.CUP })
  @IsEnum(CurrencyEnum)
  currency: CurrencyEnum;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsUrl()
  publicationUrl?: string;

  @ApiProperty()
  @IsDateString()
  publicationDate: string;
}

export class UpdatePublicationDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'DELETED'])
  status?: string;
}

export class PublicationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() sellerId: string;
  @ApiProperty() sourceId: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() price: number;
  @ApiProperty() currency: string;
  @ApiPropertyOptional() locationId?: string;
  @ApiPropertyOptional() publicationUrl?: string;
  @ApiProperty() publicationDate: Date;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
