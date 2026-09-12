import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Notify when an alert is triggered' })
  @IsOptional()
  @IsBoolean()
  alertTriggered?: boolean;

  @ApiPropertyOptional({ description: 'Notify when a new opportunity appears' })
  @IsOptional()
  @IsBoolean()
  newOpportunity?: boolean;

  @ApiPropertyOptional({ description: 'Notify when market average changes significantly' })
  @IsOptional()
  @IsBoolean()
  marketChange?: boolean;

  @ApiPropertyOptional({ description: 'Receive weekly digest email' })
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;
}

export class NotificationPreferencesResponseDto {
  @ApiPropertyOptional() id?: string;
  @ApiPropertyOptional() userId?: string;
  @ApiPropertyOptional() alertTriggered?: boolean;
  @ApiPropertyOptional() newOpportunity?: boolean;
  @ApiPropertyOptional() marketChange?: boolean;
  @ApiPropertyOptional() weeklyDigest?: boolean;
}
