import fc from 'fast-check';
import { DuplicateDetectionService } from '../../modules/publications/duplicate-detection.service';

// Feature: mercury-mvp — Duplicate detection scoring

const service = new DuplicateDetectionService();

describe('DuplicateDetectionService', () => {
  it('identical publications get score >= 70 (duplicate)', () => {
    fc.assert(
      fc.property(
        fc.record({
          originalUrl: fc.webUrl(),
          sellerPhone: fc.stringOf(fc.digit(), { minLength: 8, maxLength: 10 }),
          title: fc.string({ minLength: 5, maxLength: 100 }),
          price: fc.float({ min: 1, max: 100000, noNaN: true }),
          locationText: fc.string({ minLength: 3, maxLength: 50 }),
        }),
        (pub) => {
          const score = service.calculateDuplicateScore(
            { ...pub, imageUrls: [] },
            { ...pub, imageUrls: [] },
          );
          return score >= 70;
        },
      ),
      { numRuns: 50 },
    );
  });

  it('publications with same URL always get score >= 30', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.string({ minLength: 5 }),
        fc.string({ minLength: 5 }),
        (url, titleA, titleB) => {
          const score = service.calculateDuplicateScore(
            { originalUrl: url, title: titleA, price: 1000, imageUrls: [] },
            { originalUrl: url, title: titleB, price: 2000, imageUrls: [] },
          );
          return score >= 30;
        },
      ),
      { numRuns: 50 },
    );
  });

  it('score is always between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          originalUrl: fc.option(fc.webUrl()),
          sellerPhone: fc.option(fc.string({ minLength: 8 })),
          title: fc.string({ minLength: 1 }),
          price: fc.float({ min: 1, max: 100000, noNaN: true }),
        }),
        fc.record({
          originalUrl: fc.option(fc.webUrl()),
          sellerPhone: fc.option(fc.string({ minLength: 8 })),
          title: fc.string({ minLength: 1 }),
          price: fc.float({ min: 1, max: 100000, noNaN: true }),
        }),
        (pubA, pubB) => {
          const score = service.calculateDuplicateScore(
            { ...pubA, imageUrls: [], originalUrl: pubA.originalUrl ?? undefined, sellerPhone: pubA.sellerPhone ?? undefined },
            { ...pubB, imageUrls: [], originalUrl: pubB.originalUrl ?? undefined, sellerPhone: pubB.sellerPhone ?? undefined },
          );
          return score >= 0 && score <= 100;
        },
      ),
      { numRuns: 100 },
    );
  });
});
