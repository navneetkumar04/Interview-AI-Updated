# Multi-stage production build for Interview.AI
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies (including devDependencies required for build)
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite frontend and bundled Node/Express server into /app/dist
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and backend assets from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
