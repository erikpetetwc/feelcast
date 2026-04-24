#!/bin/bash
set -e
echo "→ Pulling latest code..."
git pull -q
echo "→ Installing dependencies..."
npm install --silent
echo "→ Running migrations..."
npx prisma migrate deploy
echo "→ Generating Prisma client..."
npx prisma generate
echo "→ Building..."
npm run build
echo "→ Restarting..."
pm2 restart feelcast
echo "✅ Done"
