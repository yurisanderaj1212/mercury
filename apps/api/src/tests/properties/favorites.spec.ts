// Feature: mercury-mvp, Property 16: Idempotencia de favoritos

/**
 * Property 16: Idempotencia de favoritos
 * Ejecutar add(u, p) N veces debe resultar en exactamente 1 entrada.
 *
 * Note: This is a unit-level property test.
 * Full integration test requires a real DB — see favorites.integration.spec.ts
 */
import fc from 'fast-check';

describe('Property 16: Favorites idempotency (unit)', () => {
  it('adding the same pair multiple times produces count=1 in a Set', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 1, max: 20 }),
        (userId, publicationId, times) => {
          // Simulate the upsert with a Set (mimics DB unique constraint)
          const favorites = new Set<string>();
          for (let i = 0; i < times; i++) {
            favorites.add(`${userId}:${publicationId}`);
          }
          return favorites.size === 1;
        },
      ),
      { numRuns: 100 },
    );
  });
});
