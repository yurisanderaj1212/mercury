-- ─── Performance verification queries ────────────────────────────────────────
-- Run these with EXPLAIN ANALYZE to verify query performance
-- Target: GET /search < 800ms, GET /publications/:id < 300ms, GET /categories < 500ms

-- 1. Verify search performance (should use idx_publications_search GIN index)
EXPLAIN ANALYZE
SELECT p.id, p.title, p.price, p.currency
FROM publications p
WHERE p.status = 'ACTIVE'
  AND to_tsvector('spanish', p.title || ' ' || COALESCE(p.description, ''))
      @@ plainto_tsquery('spanish', 'aceite vegetal')
LIMIT 20;

-- 2. Verify publication detail performance (should use primary key index)
EXPLAIN ANALYZE
SELECT p.*, s.name AS seller_name, src.name AS source_name
FROM publications p
INNER JOIN sellers s ON s.id = p.seller_id
INNER JOIN sources src ON src.id = p.source_id
WHERE p.id = '00000000-0000-0000-0000-000000000001'
  AND p.status != 'DELETED';

-- 3. Verify category listing performance (should be fast — small table)
EXPLAIN ANALYZE
SELECT * FROM categories
WHERE parent_category_id IS NULL
ORDER BY name ASC;

-- 4. Verify price range filter uses idx_publications_price_range
EXPLAIN ANALYZE
SELECT id, title, price, currency
FROM publications
WHERE status = 'ACTIVE'
  AND price >= 10000
  AND price <= 30000
  AND currency = 'CUP'
LIMIT 20;

-- 5. Verify dashboard query uses idx_publications_product_active
EXPLAIN ANALYZE
SELECT id, title, price, created_at
FROM publications
WHERE product_id = '00000000-0000-0000-0000-000000000001'
  AND status = 'ACTIVE'
ORDER BY created_at DESC
LIMIT 10;
