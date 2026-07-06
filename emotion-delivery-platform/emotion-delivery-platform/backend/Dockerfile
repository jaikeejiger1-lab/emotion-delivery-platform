# ============================================================
# Production Dockerfile for Hardyy Backend (Node.js / Express)
# Runs as non-root user 'node' for enhanced security
# ============================================================

# Base image with official Node Alpine LTS for minimal attack surface
FROM node:20-alpine AS production

# Set production environment variable
ENV NODE_ENV=production
ENV PORT=5000

# Create application directory and assign ownership to non-root user 'node'
WORKDIR /usr/src/app

# Install security updates and curl/wget for healthcheck
RUN apk add --no-cache curl

# Copy dependency manifests first for optimal Docker layer caching
COPY --chown=node:node package*.json ./

# Install exact production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code with non-root ownership
COPY --chown=node:node . .

# Ensure required runtime directories exist with appropriate permissions
RUN mkdir -p uploads && chown -R node:node /usr/src/app/uploads

# Switch to non-root user
USER node

# Expose backend port
EXPOSE 5000

# Add container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "server.js"]
