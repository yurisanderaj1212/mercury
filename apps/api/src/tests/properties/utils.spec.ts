import fc from 'fast-check';
import { slugify } from '../../../../../packages/utils/src/slugify';
import { normalizePrice } from '../../../../../packages/utils/src/normalizePrice';

// Feature: mercury-mvp — Property tests for shared utilities

describe('slugify', () => {
  it('always produces URL-safe strings (only a-z, 0-9, hyphen)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (text) => {
          const result = slugify(text);
          // Empty string is valid for degenerate inputs (all special chars)
          return result === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('never starts or ends with a hyphen', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (text) => {
          const result = slugify(text);
          return result === '' || (!result.startsWith('-') && !result.endsWith('-'));
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('normalizePrice', () => {
  it('never returns negative for positive inputs', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 9_999_999, noNaN: true }),
        (price) => {
          const result = normalizePrice(price);
          return result >= 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('handles "25mil" pattern correctly', () => {
    expect(normalizePrice('25mil')).toBe(25000);
    expect(normalizePrice('1.5mil')).toBe(1500);
  });

  it('handles "25k" pattern correctly', () => {
    expect(normalizePrice('25k')).toBe(25000);
    expect(normalizePrice('25K')).toBe(25000);
  });

  it('returns 0 for invalid inputs', () => {
    expect(normalizePrice('abc')).toBe(0);
    expect(normalizePrice('-100')).toBe(0);
    expect(normalizePrice(-50)).toBe(0);
  });
});
