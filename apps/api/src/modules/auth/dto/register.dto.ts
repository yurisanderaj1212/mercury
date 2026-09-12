import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'INVALID_EMAIL_FORMAT' })
  email: string;

  @ApiProperty({ example: 'contraseña123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'PASSWORD_TOO_SHORT' })
  password: string;

  @ApiProperty({ example: 'Juan García' })
  @IsString()
  @IsNotEmpty({ message: 'FULL_NAME_REQUIRED' })
  fullName: string;
}
