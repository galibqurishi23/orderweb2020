#!/bin/bash

# OrderWeb Database Backup Script
# Creates compressed backups of your OrderWeb database

set -e

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '#' | xargs)
elif [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
else
    echo "Error: No environment file found"
    exit 1
fi

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME=${DB_NAME:-${DATABASE_NAME}}
DB_USER=${DB_USER:-${DATABASE_USER}}
DB_PASSWORD=${DB_PASSWORD:-${DATABASE_PASSWORD}}
DB_HOST=${DB_HOST:-${DATABASE_HOST:-localhost}}
DB_PORT=${DB_PORT:-${DATABASE_PORT:-3306}}

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup filename
BACKUP_FILE="$BACKUP_DIR/orderweb_backup_$DATE.sql"

echo "🗄️  Creating database backup..."
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Create database dump
mysqldump \
    --host=$DB_HOST \
    --port=$DB_PORT \
    --user=$DB_USER \
    --password=$DB_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --opt \
    $DB_NAME > $BACKUP_FILE

# Compress the backup
echo "🗜️  Compressing backup..."
gzip $BACKUP_FILE

COMPRESSED_FILE="$BACKUP_FILE.gz"
FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo "✅ Backup completed successfully!"
echo "File: $COMPRESSED_FILE"
echo "Size: $FILE_SIZE"

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "orderweb_backup_*.sql.gz" -mtime +7 -delete
echo "✅ Cleanup completed"

# List recent backups
echo ""
echo "📁 Recent backups:"
ls -la $BACKUP_DIR/orderweb_backup_*.sql.gz 2>/dev/null | tail -5 || echo "No previous backups found"
