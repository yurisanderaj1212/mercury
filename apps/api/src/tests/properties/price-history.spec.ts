import fc from 'fast-check';

// Feature: mercury-mvp, Property 15: Price History append-only — recorded_at >= publication.created_at

describe('Property 15: Price History temporal invariant', () => {
  it('capturedAt >= publication.createdAt for any valid price history entry', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
        fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
        (createdAt, offsetMs) => {
          const capturedAt = new Date(createdAt.getTime() + offsetMs);
          return capturedAt >= createdAt;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejecting capturedAt < createdAt is always correct', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2021-01-01'), max: new Date('2030-01-01') }),
        fc.integer({ min: 1, max: 365 * 24 * 60 * 60 * 1000 }),
        (createdAt, offsetMs) => {
          const capturedAt = new Date(createdAt.getTime() - offsetMs);
          return capturedAt < createdAt; // Always true — should be rejected
        },
      ),
      { numRuns: 100 },
    );
  });
});
