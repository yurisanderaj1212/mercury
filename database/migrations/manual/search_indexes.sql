-- ─── Índices de rendimiento críticos para Mercury MVP ─────────────────────────
-- Ejecutar DESPUÉS de la migración inicial: prisma migrate deploy
-- Comando: psql $DATABASE_URL -f database/migrations/manual/search_indexes.sql

-- Búsqueda full-text en español (título + descripción)
-- Permite búsquedas rápidas case-insensitive con PostgreSQL tsvector
CREATE INDEX IF NOT EXISTS idx_publications_search
ON publications USING GIN(
  to_tsvector('spanish', title || ' ' || COALESCE(description, ''))
);

-- Rango de precios en publicaciones activas
-- Usado en filtros de precio del motor de búsqueda
CREATE INDEX IF NOT EXISTS idx_publications_price_range
ON publications (price, currency)
WHERE status = 'ACTIVE';

-- Dashboard: publicaciones recientes activas por producto
-- Usado en la pantalla de producto y estadísticas de mercado
CREATE INDEX IF NOT EXISTS idx_publications_product_active
ON publications (product_id, status, created_at DESC)
WHERE status = 'ACTIVE';
