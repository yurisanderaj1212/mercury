FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY database/ ./database/

# Install all deps (dev included — needed for build and prisma CLI)
RUN HUSKY=0 pnpm install --frozen-lockfile --filter @mercury/api... --filter database

# Generate Prisma client
RUN pnpm --filter database prisma:generate

# Build the API
RUN pnpm --filter @mercury/api build

# Remove dev deps after build to slim the image
RUN pnpm --filter @mercury/api... --filter database prune --prod

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
