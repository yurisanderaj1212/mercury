import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID, IsNumber, IsPositive, IsEnum, IsOptional, Min, Max,
  ValidateIf,
} from 'class-validator';

export enum AlertTypeEnum {
  PRICE_BELOW          = 'PRICE_BELOW',
  PRICE_ABOVE          = 'PRICE_ABOVE',
  PRICE_CHANGE_PERCENT = 'PRICE_CHANGE_PERCENT',
  NEW_PRODUCT_MATCH    = 'NEW_PRODUCT_MATCH',
  HIGH_OPPORTUNITY     = 'HIGH_OPPORTUNITY',
  MARKET_CHANGE        = 'MARKET_CHANGE',
}

export enum CurrencyEnum {
  CUP = 'CUP',
  USD = 'USD',
  MLC = 'MLC',
  EUR = 'EUR',
}

export class CreateAlertDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 25000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maximumPrice: number;

  @ApiProperty({ enum: CurrencyEnum, default: CurrencyEnum.CUP })
  @IsEnum(CurrencyEnum)
  currency: CurrencyEnum;

  @ApiProperty({ enum: AlertTypeEnum, default: AlertTypeEnum.PRICE_BELOW })
  @IsEnum(AlertTypeEnum)
  alertType: AlertTypeEnum;

  @ApiPropertyOptional({ description: 'Required for PRICE_CHANGE_PERCENT and MARKET_CHANGE' })
  @ValidateIf((o: CreateAlertDto) =>
    o.alertType === AlertTypeEnum.PRICE_CHANGE_PERCENT ||
    o.alertType === AlertTypeEnum.MARKET_CHANGE,
  )
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  changePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;
}

export class UpdateAlertDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'PAUSED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'PAUSED'])
  status?: 'ACTIVE' | 'PAUSED';
}

export class AlertResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() productId: string;
  @ApiProperty() maximumPrice: number;
  @ApiProperty() currency: string;
  @ApiProperty() alertType: string;
  @ApiPropertyOptional() changePercent?: number;
  @ApiPropertyOptional() locationId?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() triggeredAt?: Date;
  @ApiPropertyOptional() triggeredPrice?: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
