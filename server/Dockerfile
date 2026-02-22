# Build stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy Prisma schema early for postinstall generate hook
COPY prisma ./prisma

# Install dependencies
RUN npm install && npm install -g typescript

# Copy server code
COPY . .

# Generate Prisma client and build TypeScript
RUN npm run build

# Production stage
FROM node:20

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./

# Copy Prisma schema before installing dependencies so postinstall `prisma generate` succeeds
COPY --from=builder /app/prisma ./prisma

RUN npm ci --omit=dev

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Note: npm ci --omit=dev combined with postinstall in package.json
# automatically generates the Prisma client for this production alpine image.
# We do not need to copy the @prisma/client folder from the builder, 
# as that might contain binaries meant for the builder's OS/libc rather than production's.

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Start the server with db push directly using npx
CMD npx prisma db push && node dist/index.js

# Expose the API and WebSocket port
EXPOSE 3001
