#!/bin/sh
# MarketFlow Database Backup Script
# Usage: ./docker/backup.sh [max-age-days]
# Recommended cron: 0 3 * * * /path/to/docker/backup.sh 30

set -e

MAX_AGE="${1:-30}"
BACKUP_DIR="${BACKUP_DIR:-./data/backups}"
DB_PATH="${DATABASE_URL:-./data/marketflow.db}"

# Remove file:// prefix if present
DB_PATH="${DB_PATH#file:}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/marketflow-${TIMESTAMP}.db"

if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: Database not found at $DB_PATH"
  exit 1
fi

cp "$DB_PATH" "$BACKUP_FILE"

echo "{
  \"backupFile\": \"$BACKUP_FILE\",
  \"createdAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"size\": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo 0),
  \"maxAgeDays\": $MAX_AGE
}" > "${BACKUP_FILE}.json"

echo "Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Clean old backups
echo "Cleaning backups older than $MAX_AGE days..."
find "$BACKUP_DIR" -name "marketflow-*.db" -type f -mtime "+${MAX_AGE}" -delete
find "$BACKUP_DIR" -name "marketflow-*.json" -type f -mtime "+${MAX_AGE}" -delete

REMAINING=$(find "$BACKUP_DIR" -name "marketflow-*.db" -type f | wc -l)
echo "Remaining backups: $REMAINING"
echo "Backup complete."
