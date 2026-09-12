import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty()
  @IsUUID()
  publicationId: string;
}

export class FavoriteResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() publicationId: string;
  @ApiProperty() createdAt: Date;
}
