import type { PipelineStage, ProcessingContext } from '../interfaces/pipeline.interface';

/**
 * Runs pipeline stages in sequence.
 * If a stage fails, the error is captured in ctx.errors — pipeline continues.
 * Critical errors can abort by setting ctx.isDuplicate or throwing intentionally.
 */
export class PipelineRunner {
  constructor(private readonly stages: PipelineStage[]) {}

  async run(ctx: ProcessingContext): Promise<ProcessingContext> {
    let current = ctx;

    for (const stage of this.stages) {
      if (!stage.enabled) continue;

      try {
        current = await stage.process(current);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[pipeline] Stage "${stage.stageName}" failed: ${message}`);
        current = {
          ...current,
          errors: [...current.errors, `${stage.stageName}: ${message}`],
        };
      }
    }

    return current;
  }
}
