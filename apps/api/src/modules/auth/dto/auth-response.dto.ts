import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiProperty() role: string;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
}

export class TokenDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() expiresIn: number;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto }) user: UserResponseDto;
  @ApiProperty({ type: TokenDto }) token: TokenDto;
}
