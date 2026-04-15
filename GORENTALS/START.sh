#!/usr/bin/env bash
set -e

export DB_HOST="${DB_HOST:-localhost}"
export DB_PORT="${DB_PORT:-5432}"
export DB_NAME="${DB_NAME:-gorentals}"
export DB_USERNAME="${DB_USERNAME:-postgres}"
export DB_PASSWORD="${DB_PASSWORD:-postgres}"

if [ -z "${JWT_SECRET:-}" ]; then
  export JWT_SECRET="$(openssl rand -base64 48)"
fi

export DB_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"
export APP_ADMIN_EMAIL="${APP_ADMIN_EMAIL:-admin@gorentals.com}"
export APP_ADMIN_PASSWORD="${APP_ADMIN_PASSWORD:-Admin@GoRentals2025!}"
export APP_ADMIN_NAME="${APP_ADMIN_NAME:-GoRentals Admin}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "Checking PostgreSQL database ${DB_NAME}..."
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "Database ${DB_NAME} does not exist. Creating it..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE ${DB_NAME};"
else
  echo "Database ${DB_NAME} already exists."
fi

echo "Starting Spring Boot with DB_URL=${DB_URL}"
./mvnw spring-boot:run
