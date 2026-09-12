import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Only fullName and locationId can be updated by the user.
 * email and role are intentionally excluded — Admin-only.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'María López' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ example: 'uuid-of-location' })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}
