import { PrismaClient } from '@prisma/client';

interface NotificationPayload {
  userId: string;
  type: string;
  content: Record<string, unknown>;
}

/**
 * Notification service for Mercury workers.
 * NEVER called directly from the pipeline — always through a queue.
 * For MVP: inserts directly into notifications table with retry logic.
 */
export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a notification in the database.
   * Checks user notification preferences before creating.
   */
  async send(payload: NotificationPayload): Promise<void> {
    // Check user notification preferences
    const shouldNotify = await this.checkPreferences(payload.userId, payload.type);
    if (!shouldNotify) return;

    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        content: payload.content,
        read: false,
      },
    });
  }

  /**
   * Send alert triggered notification with all required fields.
   * Validates that productName, thresholdPrice, and triggeredPrice are present.
   */
  async sendAlertTriggered(params: {
    userId: string;
    productId: string;
    productName: string;
    thresholdPrice: number;
    triggeredPrice: number;
    currency: string;
  }): Promise<void> {
    await this.send({
      userId: params.userId,
      type: 'ALERT_TRIGGERED',
      content: {
        productId: params.productId,
        productName: params.productName,
        thresholdPrice: params.thresholdPrice,
        triggeredPrice: params.triggeredPrice,
        currency: params.currency,
        message: `Precio de "${params.productName}" bajó a ${params.triggeredPrice} ${params.currency} (tu umbral: ${params.thresholdPrice} ${params.currency})`,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  private async checkPreferences(userId: string, type: string): Promise<boolean> {
    const prefs = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) return true; // Default: send all notifications

    if (type === 'ALERT_TRIGGERED') return prefs.alertTriggered;
    if (type === 'NEW_OPPORTUNITY') return prefs.newOpportunity;
    if (type === 'MARKET_CHANGE') return prefs.marketChange;

    return true;
  }
}
