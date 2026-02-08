# Multi-stage Dockerfile for Node.js Backend

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

COPY package*.json ./
RUN npm install

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build 2>/dev/null || echo "No build script"

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy dist if it exists, otherwise copy src
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Stage 4: Development
FROM node:20-alpine AS development
WORKDIR /app

RUN apk add --no-cache dumb-init git
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]
