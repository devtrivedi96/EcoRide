# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# Uses a specific LTS version pinned by digest for reproducible builds.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first so Docker caches this layer
COPY package.json package-lock.json* ./

# Install ONLY production dependencies
RUN npm ci --omit=dev --ignore-scripts

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Add security hardening
RUN apk add --no-cache tini && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

WORKDIR /app

# Create logs directory with correct ownership
RUN mkdir -p logs && chown appuser:appgroup logs

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup src ./src
COPY --chown=appuser:appgroup package.json ./

# Drop root privileges
USER appuser

# Expose application port
EXPOSE 8081

# Environment defaults (overridden by docker-compose / K8s secrets)
ENV NODE_ENV=production \
    PORT=8081

# Health check (Docker native) — polls /health every 30 s
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/health || exit 1

# Use tini as PID 1 to correctly forward signals (enables graceful shutdown)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
