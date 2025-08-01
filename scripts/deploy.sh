#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/${TIMESTAMP}"

echo "🚀 Starting deployment to ${ENVIRONMENT}..."

# Function to print colored output
print_status() {
    echo -e "\033[1;34m$1\033[0m"
}

print_error() {
    echo -e "\033[1;31m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m$1\033[0m"
}

# Check if environment file exists
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    print_error "❌ Environment file .env.${ENVIRONMENT} not found!"
    exit 1
fi

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Backup current deployment
print_status "📦 Creating backup..."
if [ -d "dist" ]; then
    cp -r dist "${BACKUP_DIR}/dist"
    print_success "✅ Backup created in ${BACKUP_DIR}"
fi

# Load environment variables
print_status "🔧 Loading environment configuration..."
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)

# Install dependencies
print_status "📥 Installing dependencies..."
pnpm install --frozen-lockfile --prod

# Run tests
print_status "🧪 Running tests..."
pnpm run test
pnpm run test:e2e

# Build application
print_status "🔨 Building application..."
pnpm run build

# Database migration (if needed)
print_status "🗄️  Running database migrations..."
# pnpm run migration:run

# Health check before deployment
print_status "🏥 Performing pre-deployment health check..."
if ! curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    print_status "ℹ️  Application not running, proceeding with deployment..."
else
    print_status "⚠️  Application is running, stopping for deployment..."
    docker-compose -f docker-compose.prod.yml down
fi

# Deploy using Docker Compose
print_status "🐳 Deploying with Docker Compose..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for application to start
print_status "⏳ Waiting for application to start..."
timeout=60
counter=0

while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        print_success "✅ Application is healthy!"
        break
    fi
    sleep 2
    counter=$((counter + 2))
    echo -n "."
done

if [ $counter -ge $timeout ]; then
    print_error "❌ Application failed to start within ${timeout} seconds"
    print_error "🔄 Rolling back to previous version..."
    
    # Rollback
    docker-compose -f docker-compose.prod.yml down
    if [ -d "${BACKUP_DIR}/dist" ]; then
        rm -rf dist
        cp -r "${BACKUP_DIR}/dist" dist
    fi
    
    exit 1
fi

# Post-deployment tasks
print_status "🔄 Running post-deployment tasks..."

# Seed initial data (if needed)
# pnpm run seed:production

# Clear application cache
# pnpm run cache:clear

# Cleanup old backups (keep last 5)
print_status "🧹 Cleaning up old backups..."
cd backups
ls -t | tail -n +6 | xargs -r rm -rf
cd ..

print_success "🎉 Deployment completed successfully!"
print_success "🌐 Application URL: http://localhost:3000/api/v1"
print_success "📖 API Documentation: http://localhost:3000/api/docs"
print_success "📊 Health Check: http://localhost:3000/api/v1/health"

echo ""
print_status "📋 Deployment Summary:"
echo "  Environment: ${ENVIRONMENT}"
echo "  Timestamp: ${TIMESTAMP}"
echo "  Backup Location: ${BACKUP_DIR}"
echo "  Docker Services:"
docker-compose -f docker-compose.prod.yml ps
