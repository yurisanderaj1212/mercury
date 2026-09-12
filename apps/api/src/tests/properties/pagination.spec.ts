import fc from 'fast-check';

// Feature: mercury-mvp, Property 13: Paginación sin pérdida ni duplicados

describe('Property 13: Pagination — no loss, no duplicates', () => {
  it('paginating all items produces the same set as the original', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 200 }),
        fc.integer({ min: 10, max: 50 }),
        (items, pageSize) => {
          const pages: string[] = [];
          const totalPages = Math.ceil(items.length / pageSize);

          for (let page = 1; page <= totalPages; page++) {
            const slice = items.slice((page - 1) * pageSize, page * pageSize);
            pages.push(...slice);
          }

          // No loss — all items present
          const noLoss = pages.length === items.length;
          // No duplicates
          const noDuplicates = new Set(pages).size === items.length;

          return noLoss && noDuplicates;
        },
      ),
      { numRuns: 100 },
    );
  });
});
