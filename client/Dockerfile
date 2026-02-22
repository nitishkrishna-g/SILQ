# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy client code
COPY . .

# Build Next.js app
# Set an arg and env for backend URL assuming Next.js uses NEXT_PUBLIC_...
ARG NEXT_PUBLIC_SERVER_URL=http://localhost:3001
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets and required files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose Next.js port
EXPOSE 3000

# Set environment variables for Next.js runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: server.js is created by Next.js standalone output
CMD ["node", "server.js"]
