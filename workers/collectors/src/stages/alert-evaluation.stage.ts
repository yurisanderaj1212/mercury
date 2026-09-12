import type { PipelineStage, ProcessingContext } from '../interfaces/pipeline.interface';
import { PrismaClient } from '@prisma/client';

export class AlertEvaluationStage implements PipelineStage {
  readonly stageName = 'alert-evaluation';
  readonly enabled = true;

  constructor(private readonly prisma: PrismaClient) {}

  async process(ctx: ProcessingContext): Promise<ProcessingContext> {
    if (ctx.isDuplicate || !ctx.normalizedData || !ctx.metadata['productId']) {
      return ctx;
    }

    const productId = String(ctx.metadata['productId']);
    const { amount, currency } = ctx.normalizedData.price;

    // Find active PRICE_BELOW alerts for this product and currency
    const activeAlerts = await this.prisma.alert.findMany({
      where: {
        productId,
        status: 'ACTIVE',
        currency: currency as 'CUP' | 'USD' | 'MLC' | 'EUR',
        alertType: 'PRICE_BELOW',
      },
    });

    // Trigger alerts where price <= threshold
    for (const alert of activeAlerts) {
      if (amount <= Number(alert.maximumPrice)) {
        await this.prisma.$transaction(async (tx) => {
          await tx.alert.update({
            where: { id: alert.id },
            data: {
              status: 'TRIGGERED',
              triggeredAt: new Date(),
              triggeredPrice: amount,
            },
          });

          await tx.notification.create({
            data: {
              userId: alert.userId,
              type: 'ALERT_TRIGGERED',
              content: {
                productId,
                alertId: alert.id,
                thresholdPrice: Number(alert.maximumPrice),
                triggeredPrice: amount,
                currency,
              },
            },
          });
        });
      }
    }

    return ctx;
  }
}
