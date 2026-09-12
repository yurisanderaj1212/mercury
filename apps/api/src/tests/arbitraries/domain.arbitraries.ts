import fc from 'fast-check';

// ─── Valid generators ─────────────────────────────────────────────────────────

export const validEmail = fc.emailAddress();

export const validPassword = fc.string({ minLength: 8, maxLength: 100 }).filter(
  (s) => s.trim().length >= 8,
);

export const validFullName = fc.string({ minLength: 2, maxLength: 100 }).filter(
  (s) => s.trim().length >= 2,
);

export const validMoney = fc.record({
  amount: fc.float({ min: 0.01, max: 9_999_999.99, noNaN: true }),
  currency: fc.constantFrom('CUP', 'USD', 'MLC', 'EUR'),
});

export const validPublication = fc.record({
  title: fc.string({ minLength: 3, maxLength: 200 }),
  price: fc.float({ min: 0.01, max: 9_999_999.99, noNaN: true }),
  currency: fc.constantFrom('CUP', 'USD', 'MLC'),
  status: fc.constantFrom('ACTIVE', 'INACTIVE', 'EXPIRED'),
});

export const validPriceList = fc.array(
  fc.float({ min: 0.01, max: 9_999_999.99, noNaN: true }),
  { minLength: 1, maxLength: 100 },
);

// ─── Invalid generators ───────────────────────────────────────────────────────

export const invalidEmail = fc.oneof(
  fc.string({ maxLength: 5 }).filter((s) => !s.includes('@')),
  fc.constant('notanemail'),
  fc.constant('@nodomain.com'),
  fc.constant('missing@'),
);

export const shortPassword = fc.string({ minLength: 0, maxLength: 7 });

export const negativePrice = fc.float({ min: -9_999_999, max: -0.01, noNaN: true });

export const zeroPrice = fc.constant(0);
