import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  UpdateNotificationPreferencesDto,
  NotificationPreferencesResponseDto,
} from './dto/notification-preferences.dto';

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<NotificationPreferencesResponseDto> {
    const prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // Return defaults if not set yet
    if (!prefs) {
      return {
        userId,
        alertTriggered: true,
        newOpportunity: false,
        marketChange: false,
        weeklyDigest: true,
      };
    }

    return {
      id: prefs.id,
      userId: prefs.userId,
      alertTriggered: prefs.alertTriggered,
      newOpportunity: prefs.newOpportunity,
      marketChange: prefs.marketChange,
      weeklyDigest: prefs.weeklyDigest,
    };
  }

  async update(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    const prefs = await this.prisma.notificationPreferences.upsert({
      where: { userId },
      update: {
        ...(dto.alertTriggered !== undefined && { alertTriggered: dto.alertTriggered }),
        ...(dto.newOpportunity !== undefined && { newOpportunity: dto.newOpportunity }),
        ...(dto.marketChange !== undefined && { marketChange: dto.marketChange }),
        ...(dto.weeklyDigest !== undefined && { weeklyDigest: dto.weeklyDigest }),
      },
      create: {
        userId,
        alertTriggered: dto.alertTriggered ?? true,
        newOpportunity: dto.newOpportunity ?? false,
        marketChange: dto.marketChange ?? false,
        weeklyDigest: dto.weeklyDigest ?? true,
      },
    });

    return {
      id: prefs.id,
      userId: prefs.userId,
      alertTriggered: prefs.alertTriggered,
      newOpportunity: prefs.newOpportunity,
      marketChange: prefs.marketChange,
      weeklyDigest: prefs.weeklyDigest,
    };
  }

  /**
   * Check if user wants to receive a specific notification type.
   * Used by notification senders before creating a notification.
   */
  async shouldNotify(userId: string, type: 'alertTriggered' | 'newOpportunity' | 'marketChange' | 'weeklyDigest'): Promise<boolean> {
    const prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
      select: { [type]: true },
    });

    // Default to true if no preferences set
    if (!prefs) return true;

    return (prefs as Record<string, boolean>)[type] ?? true;
  }
}
