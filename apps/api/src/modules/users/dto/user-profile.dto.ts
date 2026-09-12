import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiProperty() role: string;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() municipality?: string;
  @ApiPropertyOptional() province?: string;
  @ApiPropertyOptional() avatarUrl?: string;
  @ApiPropertyOptional() lastLogin?: Date;
}
