#!/bin/bash

# Development Environment Setup Script
# Usage: ./scripts/setup-development.sh

set -e

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

print_warning() {
    echo -e "\033[1;33m$1\033[0m"
}

echo "🚀 Setting up development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "✅ Node.js $(node --version) detected"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_status "📦 Installing pnpm..."
    npm install -g pnpm@8.15.0
fi

print_success "✅ pnpm $(pnpm --version) detected"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "⚠️  Docker is not installed. You'll need to set up MongoDB and Redis manually."
    DOCKER_AVAILABLE=false
else
    print_success "✅ Docker $(docker --version | cut -d ' ' -f 3 | cut -d ',' -f 1) detected"
    DOCKER_AVAILABLE=true
fi

# Install dependencies
print_status "📥 Installing dependencies..."
pnpm install

# Setup environment file
if [ ! -f ".env.development" ]; then
    print_status "🔧 Creating development environment file..."
    cp .env.template .env.development
    print_success "✅ Created .env.development"
    print_warning "⚠️  Please update .env.development with your specific configuration"
else
    print_success "✅ Development environment file already exists"
fi

# Setup test environment file
if [ ! -f ".env.test" ]; then
    print_status "🧪 Creating test environment file..."
    cp .env.template .env.test
    
    # Update test-specific values
    sed -i.bak 's/boilerplate/boilerplate-test/g' .env.test
    sed -i.bak 's/3000/3001/g' .env.test
    rm .env.test.bak 2>/dev/null || true
    
    print_success "✅ Created .env.test"
else
    print_success "✅ Test environment file already exists"
fi

# Start Docker services if available
if [ "$DOCKER_AVAILABLE" = true ]; then
    print_status "🐳 Starting Docker services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Check MongoDB
    if docker-compose ps | grep -q "mongodb.*Up"; then
        print_success "✅ MongoDB is running"
    else
        print_error "❌ MongoDB failed to start"
    fi
    
    # Check Redis
    if docker-compose ps | grep -q "redis.*Up"; then
        print_success "✅ Redis is running"
    else
        print_error "❌ Redis failed to start"
    fi
else
    print_warning "⚠️  Please start MongoDB and Redis manually:"
    print_warning "  MongoDB: mongodb://localhost:27017/boilerplate"
    print_warning "  Redis: redis://localhost:6379"
fi

# Run tests to verify setup
print_status "🧪 Running tests to verify setup..."
if pnpm run test > /dev/null 2>&1; then
    print_success "✅ Tests passed - setup is working correctly"
else
    print_warning "⚠️  Some tests failed - please check your configuration"
fi

# Build the application
print_status "🔨 Building application..."
pnpm run build

print_success "🎉 Development environment setup completed!"

echo ""
print_status "📋 Next Steps:"
echo "1. Update .env.development with your specific configuration"
echo "2. Start the development server: pnpm run start:dev"
echo "3. View API documentation: http://localhost:3000/api/docs"
echo "4. Run tests: pnpm run test"
echo ""

print_status "🔗 Useful Commands:"
echo "  pnpm run start:dev     - Start development server"
echo "  pnpm run start:debug   - Start with debugging enabled"
echo "  pnpm run test          - Run unit tests"
echo "  pnpm run test:watch    - Run tests in watch mode"
echo "  pnpm run test:e2e      - Run end-to-end tests"
echo "  pnpm run lint          - Run linter"
echo "  pnpm run format        - Format code"
echo "  pnpm run docker:dev    - Start Docker services"
echo "  pnpm run docker:down   - Stop Docker services"

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo ""
    print_status "🐳 Docker Services:"
    docker-compose ps
fi
