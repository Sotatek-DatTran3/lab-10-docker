# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files (including lock file if exists)
COPY package*.json ./

# Install all dependencies (including dev for building)
# Use npm ci if lock file exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production


# Production stage - use slim base
FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nodejs -G nodejs

# Copy only what's needed
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

CMD ["node", "dist/main.js"]
