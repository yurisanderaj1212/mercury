import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository, UserWithRole } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { TokenBlacklistService } from './token-blacklist.service';

const BCRYPT_ROUNDS = 10;
const JWT_EXPIRY_SECONDS = 86400;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly blacklist: TokenBlacklistService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check duplicate email
    const existing = await this.authRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    const roleId = await this.authRepo.findPersonalRoleId();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.authRepo.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      fullName: dto.fullName.trim(),
      roleId,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.authRepo.findByEmail(dto.email.toLowerCase().trim());

    // Never reveal which field is wrong — always INVALID_CREDENTIALS
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('ACCOUNT_SUSPENDED');
    }

    await this.authRepo.updateLastLogin(user.id);
    return this.buildAuthResponse(user);
  }

  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
    return this.toUserResponse(user);
  }

  logout(token: string): void {
    this.blacklist.blacklistToken(token);
  }

  async refresh(token: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role: string;
        status: string;
      }>(token);

      if (this.blacklist.isTokenBlacklisted(token)) {
        throw new UnauthorizedException('TOKEN_EXPIRED');
      }

      const user = await this.authRepo.findById(payload.sub);
      if (!user) throw new UnauthorizedException('UNAUTHORIZED');
      if (user.status === 'SUSPENDED') throw new UnauthorizedException('ACCOUNT_SUSPENDED');

      // Invalidate old token, issue new one
      this.blacklist.blacklistToken(token);
      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('TOKEN_EXPIRED');
    }
  }

  private buildAuthResponse(user: UserWithRole): AuthResponseDto {
    const payload = { sub: user.id, email: user.email, role: user.role.name, status: user.status };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: this.toUserResponse(user),
      token: { accessToken, expiresIn: JWT_EXPIRY_SECONDS },
    };
  }

  private toUserResponse(user: UserWithRole): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role.name,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
