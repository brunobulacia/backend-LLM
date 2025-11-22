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

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

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

# Create a startup script with better error handling
RUN echo '#!/bin/sh\necho "Starting application..."\necho "Current working directory: $(pwd)"\necho "Checking dist directory:"\nls -la dist/\necho "Checking environment variables:"\necho "NODE_ENV: $NODE_ENV"\necho "PORT: $PORT"\necho "DATABASE_URL: ${DATABASE_URL:0:20}..." # Only show first 20 chars for security\necho "Running Prisma migrations..."\nnpx prisma migrate deploy\necho "Starting the application..."\nif [ -f "dist/main.js" ]; then\n  echo "Found dist/main.js, starting..."\n  node dist/main.js\nelif [ -f "dist/main" ]; then\n  echo "Found dist/main, starting..."\n  node dist/main\nelse\n  echo "Error: No main file found in dist/"\n  echo "Contents of dist directory:"\n  ls -la dist/\n  exit 1\nfi' > /usr/src/app/start.sh
RUN chmod +x /usr/src/app/start.sh

# Run database migrations and start the application
CMD ["/usr/src/app/start.sh"]