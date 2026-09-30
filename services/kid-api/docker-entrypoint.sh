#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL database to be ready..."
until nc -z -v -w30 postgres 5432; do
  echo "Waiting for database connection on postgres:5432..."
  sleep 2
done

echo "🚀 Starting VocabFlow Kid API (port 4100)..."
if [ -f "dist/main.js" ]; then
  exec node dist/main.js
elif [ -f "dist/src/main.js" ]; then
  exec node dist/src/main.js
else
  MAIN_FILE=$(find dist -name "main.js" | head -n 1)
  if [ -n "$MAIN_FILE" ]; then
    exec node "$MAIN_FILE"
  else
    echo "ERROR: main.js not found in dist!"
    exit 1
  fi
fi
