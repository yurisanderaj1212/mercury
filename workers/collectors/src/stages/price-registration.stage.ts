import type { PipelineStage, ProcessingContext } from '../interfaces/pipeline.interface';
import { PrismaClient } from '@prisma/client';

export class PriceRegistrationStage implements PipelineStage {
  readonly stageName = 'price-registration';
  readonly enabled = true;

  constructor(private readonly prisma: PrismaClient) {}

  async process(ctx: ProcessingContext): Promise<ProcessingContext> {
    // Skip duplicates
    if (ctx.isDuplicate || !ctx.normalizedData || !ctx.metadata['publicationId']) {
      return ctx;
    }

    const publicationId = String(ctx.metadata['publicationId']);
    const { amount, currency } = ctx.normalizedData.price;
    const capturedAt = new Date();

    // Append-only — never modify existing price history
    await this.prisma.priceHistory.create({
      data: {
        publicationId,
        price: amount,
        currency: currency as 'CUP' | 'USD' | 'MLC' | 'EUR',
        capturedAt,
      },
    });

    return {
      ...ctx,
      priceHistoryEntry: { price: amount, currency, capturedAt },
    };
  }
}
