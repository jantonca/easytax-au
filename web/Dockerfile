# ==============================================================================
# EasyTax-AU Web Dockerfile (build context: repository root)
# Multi-stage build: pnpm workspace install -> Vite build -> nginx runtime
# ==============================================================================

# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Install pnpm at the pinned version (packageManager in package.json)
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

# Docker COPY paths are relative to the build context, which is the repository
# root: the workspace manifests live at the root and the web manifest in web/.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json ./web/package.json

# Install all workspace dependencies from the authoritative root lockfile
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@11.8.0 --activate

WORKDIR /app

# Copy installed dependencies from deps stage. pnpm workspace layout keeps
# frontend package links and executables in /app/web/node_modules (pointing
# into the shared /app/node_modules/.pnpm store) — both must be copied.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Copy workspace manifests, shared generated types and the web sources
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared ./shared
COPY web ./web

# Build argument for API URL (will be baked into the JS bundle)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build the application (tsc -b && vite build via the workspace script)
RUN pnpm --filter web build

# Stage 3: Production Runtime (nginx)
# -----------------------------------------------------------------------------
FROM nginx:1.25-alpine AS production

# Create nginx user for security (non-root)
RUN addgroup -g 101 -S nginx || true && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx || true

# Copy custom nginx configuration
COPY web/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/web/dist /usr/share/nginx/html

# Set ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Create nginx pid directory
RUN mkdir -p /var/run && \
    chown -R nginx:nginx /var/run

# Health check — probe 127.0.0.1 explicitly: nginx binds the IPv4 wildcard
# only (`listen 80`), and busybox wget resolves localhost to ::1 first,
# which made the container report `unhealthy` despite serving correctly.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Master process must stay root to bind port 80 (<1024) inside the container;
# nginx.conf's `user nginx;` directive makes the actual worker processes run
# unprivileged. Running the master as `nginx` (uid 101) cannot bind port 80
# and was validated as broken by the Docker runtime phase.
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
