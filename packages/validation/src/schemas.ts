import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('INVALID_EMAIL_FORMAT')
  .min(1)
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, 'PASSWORD_TOO_SHORT')
  .max(128);

export const moneySchema = z.object({
  amount: z.number().positive().multipleOf(0.01),
  currency: z.enum(['CUP', 'USD', 'MLC', 'EUR']),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const dateRangeSchema = z.object({
  from: z.string().datetime().or(z.date()),
  to: z.string().datetime().or(z.date()),
}).refine(
  (data) => new Date(data.from) <= new Date(data.to),
  { message: 'INVALID_DATE_RANGE: from must be <= to' },
);

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'INVALID_SLUG_FORMAT');
