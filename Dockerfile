# =============================================================================
# EasyTax-AU API Dockerfile (build context: repository root)
# Multi-stage build for minimal production image
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies (workspace-aware, authoritative root lockfile)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Install pnpm at the pinned version (packageManager in package.json)
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

# The workspace manifest carries the lifecycle policy (allowBuilds) and the
# dependency overrides; without it the frozen-lockfile check fails.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/package.json

# Install all dependencies (including devDependencies for the build)
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm run build

# Production dependency install for the root package only.
# `pnpm prune --prod` is a silent no-op inside a workspace, so devDependencies
# must be excluded by reinstalling from the same workspace lockfile with
# --prod and a package filter.
RUN CI=true pnpm --filter easytax-au install --prod --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy only production artifacts
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nestjs

# Health check (the app serves /health; there is no / route)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/src/main.js"]
