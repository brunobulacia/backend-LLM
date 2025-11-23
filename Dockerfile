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
RUN echo "Files copied to builder stage:" && ls -la && \
    echo "Checking if uploads directory exists:" && \
    test -d uploads && echo "uploads/ found" || echo "uploads/ NOT found" && \
    test -f uploads/videos/sample_640x360.mp4 && echo "sample video found" || echo "sample video NOT found"

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

# Create uploads directories 
RUN mkdir -p uploads/videos uploads/images public

# Copy uploads directory from builder stage (includes sample video)
COPY --from=builder /usr/src/app/uploads ./uploads

# Copy public directory from builder stage
COPY --from=builder /usr/src/app/public ./public

# Debug: Verify files were copied correctly
RUN echo "Production stage file verification:" && \
    ls -la uploads/ && \
    ls -la uploads/videos/ && \
    test -f uploads/videos/sample_640x360.mp4 && echo "✅ Sample video found in production stage" || echo "❌ Sample video NOT found in production stage"

# Set proper permissions for uploads directory
RUN chmod -R 755 uploads/

# Generate Prisma client for production
RUN npx prisma generate

# Expose port
EXPOSE 8080

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start the application - main.js is directly in dist/
CMD ["sh", "-c", "echo 'Starting application...' && echo 'Checking dist directory:' && ls -la dist/ && echo 'Running Prisma migrations...' && npx prisma migrate deploy && echo 'Starting NestJS app...' && node dist/main.js"]