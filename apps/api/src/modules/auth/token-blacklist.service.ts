import { Injectable } from '@nestjs/common';

/**
 * In-memory token blacklist for MVP.
 * Stores invalidated JTIs (JWT IDs) or user IDs after logout/suspend.
 * In production this should be replaced with Redis.
 */
@Injectable()
export class TokenBlacklistService {
  // Map of userId -> Set of invalidated token issuedAt timestamps
  private readonly blacklistedUsers = new Set<string>();
  private readonly blacklistedTokens = new Set<string>();

  blacklistUser(userId: string): void {
    this.blacklistedUsers.add(userId);
  }

  restoreUser(userId: string): void {
    this.blacklistedUsers.delete(userId);
  }

  blacklistToken(token: string): void {
    this.blacklistedTokens.add(token);
  }

  isUserBlacklisted(userId: string): boolean {
    return this.blacklistedUsers.has(userId);
  }

  isTokenBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }
}
