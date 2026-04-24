#!/bin/bash
set -e

echo ""
echo "======================================"
echo "  FeelCast — Raspberry Pi Setup"
echo "======================================"
echo ""

# ── Collect secrets upfront ──────────────────────────────────────────────────
read -p "Your Pi's IP address (e.g. 192.168.1.100): " PI_IP
read -p "TWC API key: " TWC_API_KEY
read -p "Postgres password to set (make one up): " DB_PASS
echo ""

NEXTAUTH_SECRET=$(openssl rand -base64 32)

# ── System packages ───────────────────────────────────────────────────────────
echo "→ Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq git curl postgresql postgresql-contrib

# ── Node.js 20 ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "→ Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
else
  echo "→ Node.js already installed ($(node -v))"
fi

# ── PostgreSQL ────────────────────────────────────────────────────────────────
echo "→ Setting up database..."
sudo systemctl enable postgresql --quiet
sudo systemctl start postgresql
sudo -u postgres psql -q <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'feelcast') THEN
    CREATE USER feelcast WITH PASSWORD '${DB_PASS}';
  END IF;
END \$\$;
SQL
sudo -u postgres psql -q -c "CREATE DATABASE feelcast OWNER feelcast;" 2>/dev/null || true

# ── Clone / update repo ───────────────────────────────────────────────────────
if [ -d "$HOME/feelcast/.git" ]; then
  echo "→ Updating existing repo..."
  cd "$HOME/feelcast"
  git pull -q
else
  echo "→ Cloning repo..."
  git clone -q https://github.com/erikpetetwc/feelcast.git "$HOME/feelcast"
  cd "$HOME/feelcast"
fi

# ── Write .env ────────────────────────────────────────────────────────────────
echo "→ Writing .env..."
cat > .env <<ENV
DATABASE_URL="postgres://feelcast:${DB_PASS}@localhost:5432/feelcast"
TWC_API_KEY="${TWC_API_KEY}"
TWC_BASE_URL="https://api.weather.com"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
AUTH_TRUST_HOST=true
AUTH_URL=http://${PI_IP}:3000
ENV

# ── Install deps, migrate, build ──────────────────────────────────────────────
echo "→ Installing dependencies..."
npm install --silent

echo "→ Running database migrations..."
npx prisma migrate deploy

echo "→ Building app (this takes a few minutes)..."
npm run build

# ── PM2 ───────────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "→ Installing PM2..."
  sudo npm install -g pm2 --silent
fi

pm2 stop feelcast 2>/dev/null || true
pm2 delete feelcast 2>/dev/null || true
pm2 start npm --name feelcast -- start
pm2 save --force

# Auto-start on reboot
STARTUP_CMD=$(pm2 startup systemd -u $USER --hp $HOME 2>&1 | grep "sudo")
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD"
fi

echo ""
echo "======================================"
echo "  ✅ FeelCast is running!"
echo "  Open: http://${PI_IP}:3000"
echo "======================================"
echo ""
