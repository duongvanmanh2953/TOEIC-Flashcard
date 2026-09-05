#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL database to be ready..."
until nc -z -v -w30 postgres 5432; do
  echo "Waiting for database connection on postgres:5432..."
  sleep 2
done

echo "🔄 Pushing database schema via Prisma..."
npx prisma db push --skip-generate

echo "🌱 Running database seed (600+ TOEIC vocabulary & demo accounts)..."
if [ -f "dist/prisma/seed.js" ]; then
  node dist/prisma/seed.js || true
elif [ -f "dist/prisma/prisma/seed.js" ]; then
  node dist/prisma/prisma/seed.js || true
else
  echo "Seed file not in expected path, searching..."
  SEED_FILE=$(find dist -name "seed.js" | head -n 1)
  if [ -n "$SEED_FILE" ]; then
    node "$SEED_FILE" || true
  fi
fi

echo "🚀 Starting LexiMind AI NestJS Backend..."
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
