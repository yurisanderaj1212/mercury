# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests first (better layer caching)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY database/ ./database/

# Install ALL deps — HUSKY=0 prevents prepare script from running husky
RUN HUSKY=0 pnpm install --frozen-lockfile --filter @mercury/api...

# Generate Prisma client using the local binary already installed
RUN ./node_modules/.bin/prisma generate --schema=database/prisma/schema.prisma

# Build the API
RUN pnpm --filter @mercury/api build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Copy everything needed from builder — no reinstall needed
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/database/prisma ./database/prisma

# Copy package manifests (needed by some loaders)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
