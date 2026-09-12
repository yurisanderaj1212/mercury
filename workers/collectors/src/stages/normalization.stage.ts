import type { PipelineStage, ProcessingContext } from '../interfaces/pipeline.interface';
import { ManualConnector } from '../connectors/manual.connector';

export class NormalizationStage implements PipelineStage {
  readonly stageName = 'normalization';
  readonly enabled = true;

  private readonly connector = new ManualConnector();

  async process(ctx: ProcessingContext): Promise<ProcessingContext> {
    if (!ctx.rawPublication) return ctx;
    const normalizedData = await this.connector.normalize(ctx.rawPublication);
    return { ...ctx, normalizedData };
  }
}
