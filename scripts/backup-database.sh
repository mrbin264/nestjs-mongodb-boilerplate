#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup-database.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/database"
BACKUP_FILE="boilerplate_${ENVIRONMENT}_${TIMESTAMP}.gz"

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

echo "🗄️  Starting database backup for ${ENVIRONMENT}..."

# Check if environment file exists
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    print_error "❌ Environment file .env.${ENVIRONMENT} not found!"
    exit 1
fi

# Load environment variables
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Extract database connection details
if [[ $DATABASE_URL =~ mongodb://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    print_error "❌ Invalid DATABASE_URL format"
    exit 1
fi

print_status "📦 Creating MongoDB backup..."
print_status "  Database: ${DB_NAME}"
print_status "  Host: ${DB_HOST}:${DB_PORT}"

# Create MongoDB dump
mongodump \
    --host "${DB_HOST}:${DB_PORT}" \
    --username "${DB_USER}" \
    --password "${DB_PASS}" \
    --db "${DB_NAME}" \
    --gzip \
    --archive="${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    print_success "✅ Database backup created successfully!"
    print_success "📁 Backup file: ${BACKUP_DIR}/${BACKUP_FILE}"
    
    # Get file size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    print_success "📊 Backup size: ${BACKUP_SIZE}"
    
    # Verify backup integrity
    print_status "🔍 Verifying backup integrity..."
    if mongorestore --help > /dev/null 2>&1; then
        # Test restore to verify backup (dry run)
        mongorestore \
            --gzip \
            --archive="${BACKUP_DIR}/${BACKUP_FILE}" \
            --dryRun \
            --quiet
        
        if [ $? -eq 0 ]; then
            print_success "✅ Backup verification successful!"
        else
            print_error "❌ Backup verification failed!"
            exit 1
        fi
    else
        print_status "⚠️  mongorestore not available, skipping verification"
    fi
    
    # Cleanup old backups (keep last 7 days)
    print_status "🧹 Cleaning up old backups..."
    find "${BACKUP_DIR}" -name "boilerplate_${ENVIRONMENT}_*.gz" -mtime +7 -delete
    
    # Create backup metadata
    cat > "${BACKUP_DIR}/${BACKUP_FILE}.meta" << EOF
{
  "environment": "${ENVIRONMENT}",
  "database": "${DB_NAME}",
  "timestamp": "${TIMESTAMP}",
  "size": "${BACKUP_SIZE}",
  "host": "${DB_HOST}:${DB_PORT}",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
    
    print_success "🎉 Database backup completed successfully!"
    
else
    print_error "❌ Database backup failed!"
    exit 1
fi

# List recent backups
print_status "📋 Recent backups:"
ls -lah "${BACKUP_DIR}" | tail -10
