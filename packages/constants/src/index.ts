// ─── Currencies ──────────────────────────────────────────────────────────────
export const CURRENCIES = ['CUP', 'USD', 'MLC', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

// ─── Alert limits ─────────────────────────────────────────────────────────────
export const ALERT_LIMIT_PERSONAL = 20;
export const ALERT_LIMIT_PROFESSIONAL = 100;
export const ALERT_LIMIT_BUSINESS = 500;

// ─── Publication expiry ───────────────────────────────────────────────────────
export const PUBLICATION_EXPIRY_DAYS = 30;

// ─── Search ───────────────────────────────────────────────────────────────────
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 50;
export const PAGE_SIZE_MIN = 10;

// ─── Pipeline ─────────────────────────────────────────────────────────────────
export const DUPLICATE_THRESHOLD = 70;

// ─── Opportunity scoring ──────────────────────────────────────────────────────
export const OPPORTUNITY_SCORE_EXCELLENT = 90;
export const OPPORTUNITY_SCORE_GOOD = 75;
export const OPPORTUNITY_SCORE_MEDIUM = 50;

// ─── Scheduler intervals (ms) ────────────────────────────────────────────────
export const SCHEDULER_EXPIRE_PUBLICATIONS_MS = 24 * 60 * 60 * 1000;  // 24h
export const SCHEDULER_EVALUATE_ALERTS_MS = 60 * 60 * 1000;            // 1h
export const SCHEDULER_REFRESH_MARKET_STATS_MS = 60 * 60 * 1000;       // 1h

// ─── User roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = ['PERSONAL', 'BUSINESS', 'SELLER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// ─── Source names ─────────────────────────────────────────────────────────────
export const SOURCE_NAMES = ['FACEBOOK', 'REVOLICO', 'MANUAL', 'IMPORT', 'API'] as const;
export type SourceName = (typeof SOURCE_NAMES)[number];
