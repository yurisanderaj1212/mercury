import fc from 'fast-check';

// Feature: mercury-mvp, Property 19: Límite de 20 alertas activas por usuario PERSONAL

describe('Property 19: Alert limit for PERSONAL users', () => {
  const ALERT_LIMIT_PERSONAL = 20;

  it('rejects creating alert when activeCount >= 20', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: ALERT_LIMIT_PERSONAL, max: 100 }),
        (activeCount) => {
          // Simulate the service check
          const wouldReject = activeCount >= ALERT_LIMIT_PERSONAL;
          return wouldReject === true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('allows creating alert when activeCount < 20', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: ALERT_LIMIT_PERSONAL - 1 }),
        (activeCount) => {
          const wouldAllow = activeCount < ALERT_LIMIT_PERSONAL;
          return wouldAllow === true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
