# Multi-stage build for optimal image size and production performance
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies including dev dependencies (needed for build)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Copy source code
COPY . .

# Run build-time validations
RUN npm run check-locales && npm run check-i18n

# Build the Next.js application (lint is handled separately in CI)
RUN npm run build -- --no-lint

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
