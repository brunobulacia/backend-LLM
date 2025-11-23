# Build stage
FROM node:22 AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Debug: List all files to ensure everything is copied
RUN echo "Files copied to builder stage:" && ls -la

# Generate Prisma client
RUN npx prisma generate

# Build the application with detailed logging
RUN echo "Building NestJS application..." && \
    npm run build && \
    echo "Build completed successfully!" && \
    echo "Contents of dist directory:" && \
    ls -la dist/ && \
    echo "Verifying main.js exists:" && \
    test -f dist/main.js && echo "main.js found in dist/!" || echo "main.js not found in dist/"

# Production stage
FROM node:22

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (needed for prisma commands)
RUN npm ci

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Generate Prisma client for production
RUN npx prisma generate

# Expose port
EXPOSE 8080

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application - main.js is directly in dist/
CMD ["sh", "-c", "echo 'Starting application...' && echo 'Checking dist directory:' && ls -la dist/ && echo 'Running Prisma migrations...' && npx prisma migrate deploy && echo 'Starting NestJS app...' && node dist/main.js"]