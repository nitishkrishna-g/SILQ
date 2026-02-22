# Build stage
FROM node:18-alpine3.16 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install OpenSSL (required for Prisma on Alpine) and dependencies
RUN apk add --no-cache openssl
RUN npm install && npm install -g typescript

# Copy server code
COPY . .

# Generate Prisma client and build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine3.16

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma/build/index.js ./node_modules/prisma/build/index.js 

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Start the server with db push directly using Node to avoid Symlink CMD CRLF issues
CMD node node_modules/prisma/build/index.js db push && node dist/index.js

# Expose the API and WebSocket port
EXPOSE 3001

# Expose the API and WebSocket port
