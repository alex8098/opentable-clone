# Multi-stage Dockerfile for Node.js Backend

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application (if using TypeScript)
RUN npm run build 2>/dev/null || echo "No build script, using source directly"

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist 2>/dev/null || COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./

# Copy any additional required files (config, migrations, etc.)
COPY --from=build /app/migrations ./migrations 2>/dev/null || true
COPY --from=build /app/seeds ./seeds 2>/dev/null || true

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Stage 4: Development
FROM node:20-alpine AS development
WORKDIR /app

# Install development tools
RUN apk add --no-cache dumb-init git

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start in development mode with hot reload
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]
