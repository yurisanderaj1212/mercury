import type { PipelineStage, ProcessingContext, NormalizedPublication } from '../interfaces/pipeline.interface';

const DUPLICATE_THRESHOLD = 70;

/**
 * Scoring weights:
 * URL(30) + Phone(25) + Images(20) + Text(15) + Price+Location(10)
 */
function calculateDuplicateScore(a: NormalizedPublication, b: NormalizedPublication): number {
  let score = 0;

  // URL match (30)
  if (a.originalUrl && b.originalUrl && a.originalUrl === b.originalUrl) score += 30;

  // Phone match (25)
  if (a.sellerPhone && b.sellerPhone && a.sellerPhone === b.sellerPhone) score += 25;

  // Image overlap (20) — check first image URL
  const aImg = a.imageUrls[0];
  const bImg = b.imageUrls[0];
  if (aImg && bImg && aImg === bImg) score += 20;

  // Title similarity (15) — simple word overlap
  const aWords = new Set(a.title.toLowerCase().split(/\s+/));
  const bWords = new Set(b.title.toLowerCase().split(/\s+/));
  const intersection = [...aWords].filter((w) => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  if (union > 0) score += Math.round((intersection / union) * 15);

  // Price + location (10)
  if (
    a.price.amount === b.price.amount &&
    a.price.currency === b.price.currency &&
    a.locationText === b.locationText
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}

export class DuplicateDetectionStage implements PipelineStage {
  readonly stageName = 'duplicate-detection';
  readonly enabled = true;

  // In-memory cache of recent normalized pubs for comparison (per run)
  private readonly seen: NormalizedPublication[] = [];

  async process(ctx: ProcessingContext): Promise<ProcessingContext> {
    if (!ctx.normalizedData) return ctx;

    let maxScore = 0;
    for (const prev of this.seen) {
      const score = calculateDuplicateScore(ctx.normalizedData, prev);
      if (score > maxScore) maxScore = score;
    }

    const isDuplicate = maxScore >= DUPLICATE_THRESHOLD;

    if (!isDuplicate) {
      this.seen.push(ctx.normalizedData);
    }

    return { ...ctx, isDuplicate, duplicateScore: maxScore };
  }
}
