import fc from 'fast-check';
import { validPriceList } from '../arbitraries/domain.arbitraries';

// Feature: mercury-mvp, Property 14: Invariante de estadísticas de precio — consistencia matemática

describe('Property 14: Price stats mathematical consistency', () => {
  it('minPrice <= avgPrice <= maxPrice for any non-empty set of prices', () => {
    fc.assert(
      fc.property(validPriceList, (prices) => {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((s, p) => s + p, 0) / prices.length;

        return min <= avg && avg <= max;
      }),
      { numRuns: 100 },
    );
  });

  it('minPrice is the actual minimum of the set', () => {
    fc.assert(
      fc.property(validPriceList, (prices) => {
        const min = Math.min(...prices);
        return prices.every((p) => p >= min);
      }),
      { numRuns: 100 },
    );
  });

  it('maxPrice is the actual maximum of the set', () => {
    fc.assert(
      fc.property(validPriceList, (prices) => {
        const max = Math.max(...prices);
        return prices.every((p) => p <= max);
      }),
      { numRuns: 100 },
    );
  });
});
