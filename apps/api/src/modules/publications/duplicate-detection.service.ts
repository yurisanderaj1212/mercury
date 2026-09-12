import { Injectable } from '@nestjs/common';

interface PublicationData {
  originalUrl?: string | null;
  sellerPhone?: string | null;
  imageUrls?: string[];
  title: string;
  price: number;
  locationText?: string | null;
}

const DUPLICATE_THRESHOLD = 70;

/**
 * DuplicateDetectionService — scores similarity between two publications.
 * Scoring: URL(30) + Phone(25) + Images(20) + Text(15) + Price+Location(10)
 * Total max: 100. Score >= 70 = duplicate.
 */
@Injectable()
export class DuplicateDetectionService {
  calculateDuplicateScore(a: PublicationData, b: PublicationData): number {
    let score = 0;

    // URL match (30 points)
    if (a.originalUrl && b.originalUrl && a.originalUrl === b.originalUrl) {
      score += 30;
    }

    // Phone match (25 points)
    if (a.sellerPhone && b.sellerPhone && a.sellerPhone === b.sellerPhone) {
      score += 25;
    }

    // Image match (20 points) — first image URL
    const aImg = a.imageUrls?.[0];
    const bImg = b.imageUrls?.[0];
    if (aImg && bImg && aImg === bImg) {
      score += 20;
    }

    // Text similarity (15 points) — Jaccard similarity on word tokens
    const aWords = new Set(a.title.toLowerCase().split(/\s+/).filter(Boolean));
    const bWords = new Set(b.title.toLowerCase().split(/\s+/).filter(Boolean));
    const intersection = [...aWords].filter((w) => bWords.has(w)).length;
    const union = new Set([...aWords, ...bWords]).size;
    if (union > 0) {
      score += Math.round((intersection / union) * 15);
    }

    // Price + Location match (10 points)
    const priceMatch = Math.abs(a.price - b.price) < 0.01;
    const locationMatch = a.locationText && b.locationText && a.locationText === b.locationText;
    if (priceMatch && locationMatch) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  isDuplicate(score: number, threshold = DUPLICATE_THRESHOLD): boolean {
    return score >= threshold;
  }
}
