import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Allow public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: UserPayload }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    try {
      const payload = this.jwtService.verify<{
        sub: string;
        email: string;
        role: string;
        status: string;
      }>(token);

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        status: payload.status,
      };

      return true;
    } catch {
      throw new UnauthorizedException('TOKEN_EXPIRED');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}
