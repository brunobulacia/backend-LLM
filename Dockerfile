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

# Build the application
RUN echo "Building NestJS application..." && \
    npm run build && \
    echo "Build completed successfully!" && \
    echo "Contents of dist directory:" && \
    ls -la dist/ && \
    echo "Contents of dist/src directory:" && \
    ls -la dist/src/ && \
    echo "Verifying main.js exists:" && \
    test -f dist/src/main.js && echo "main.js found!" || echo "ERROR: main.js not found!"

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

# Copy any additional config files if needed
COPY nest-cli.json ./
COPY tsconfig*.json ./

# Generate Prisma client for production
RUN npx prisma generate

# Expose port
EXPOSE 8080

# Set NODE_ENV to production
ENV NODE_ENV=production

# Run database migrations and start the application
CMD ["sh", "-c", "echo 'Starting application...' && echo 'Checking dist directory:' && ls -la dist/ && echo 'Checking dist/src directory:' && ls -la dist/src/ && echo 'Running Prisma migrations...' && npx prisma migrate deploy && echo 'Starting NestJS app...' && node dist/src/main.js"]