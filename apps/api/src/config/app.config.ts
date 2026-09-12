import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
  webBaseUrl: process.env.WEB_BASE_URL ?? 'http://localhost:3000',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  expiresIn: parseInt(process.env.JWT_EXPIRY ?? '86400', 10),
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL ?? '',
}));
