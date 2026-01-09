#!/bin/bash
#
# EasyTax-AU Application LXC Setup Script
#
# This script automates the setup of the application container.
# Run this INSIDE the application LXC (e.g., LXC 102)
#
# Usage:
#   1. Copy this script to the application LXC
#   2. Run: chmod +x setup-app-lxc.sh
#   3. Run: ./setup-app-lxc.sh
#

set -e  # Exit on any error

echo "========================================"
echo "EasyTax-AU Application LXC Setup"
echo "========================================"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "Error: This script must be run as root"
   exit 1
fi

# Configuration
APP_DIR="/opt/easytax-au"
APP_USER="easytax"
GIT_REPO="https://github.com/YOUR_USERNAME/easytax-au.git"
DB_HOST=""
DB_PASSWORD=""
ENCRYPTION_KEY=""

# Prompt for configuration
echo "Configuration:"
echo ""
read -p "Enter database LXC IP address (e.g., 192.168.1.101): " DB_HOST
if [[ -z "$DB_HOST" ]]; then
    echo "Error: Database host is required"
    exit 1
fi

read -s -p "Enter database password: " DB_PASSWORD
echo ""
if [[ -z "$DB_PASSWORD" ]]; then
    echo "Error: Database password is required"
    exit 1
fi

echo ""
echo "Generating encryption key..."
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "  ✓ Generated: ${ENCRYPTION_KEY:0:16}...${ENCRYPTION_KEY: -16}"

echo ""
read -p "Enter Git repository URL (or press Enter for default): " GIT_REPO_INPUT
if [[ -n "$GIT_REPO_INPUT" ]]; then
    GIT_REPO="$GIT_REPO_INPUT"
fi

echo ""
echo "Configuration summary:"
echo "  Application directory: $APP_DIR"
echo "  Application user: $APP_USER"
echo "  Database host: $DB_HOST:5432"
echo "  Git repository: $GIT_REPO"
echo ""
read -p "Continue with installation? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
fi

echo ""
echo "Step 1/10: Updating system packages..."
apt update && apt upgrade -y

echo ""
echo "Step 2/10: Installing prerequisites..."
apt install -y curl git build-essential nginx postgresql-client

echo ""
echo "Step 3/10: Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "  ✓ Node.js installed"
else
    echo "  Node.js already installed ($(node --version))"
fi

echo ""
echo "Step 4/10: Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    corepack enable
    corepack prepare pnpm@latest --activate
    echo "  ✓ pnpm installed ($(pnpm --version))"
else
    echo "  pnpm already installed ($(pnpm --version))"
fi

echo ""
echo "Step 5/10: Creating application user..."
if id "$APP_USER" &>/dev/null; then
    echo "  User $APP_USER already exists"
else
    useradd -m -s /bin/bash "$APP_USER"
    echo "  ✓ User $APP_USER created"
fi

echo ""
echo "Step 6/10: Cloning repository..."
if [[ -d "$APP_DIR/.git" ]]; then
    echo "  Repository already exists, pulling latest changes..."
    cd "$APP_DIR"
    sudo -u "$APP_USER" git pull
else
    mkdir -p "$APP_DIR"
    chown "$APP_USER:$APP_USER" "$APP_DIR"
    sudo -u "$APP_USER" git clone "$GIT_REPO" "$APP_DIR"
    echo "  ✓ Repository cloned"
fi

cd "$APP_DIR"
CURRENT_VERSION=$(git describe --tags --always 2>/dev/null || echo "unknown")
echo "  Current version: $CURRENT_VERSION"

echo ""
echo "Step 7/10: Installing dependencies and building application..."
sudo -u "$APP_USER" pnpm install
echo "  ✓ Dependencies installed"

sudo -u "$APP_USER" pnpm run build
echo "  ✓ Backend built"

# Create frontend .env with API URL
echo "VITE_API_URL=/api" > web/.env
chown "$APP_USER:$APP_USER" web/.env

sudo -u "$APP_USER" pnpm --filter web build
echo "  ✓ Frontend built"

echo ""
echo "Step 8/10: Creating environment configuration..."
cat > "$APP_DIR/.env" << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=5432
DB_USERNAME=easytax
DB_PASSWORD=$DB_PASSWORD
DB_NAME=easytax-au

# Application Configuration
NODE_ENV=production
PORT=3000

# Security Configuration
ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"
echo "  ✓ Environment file created"

echo ""
echo "Step 9/10: Creating systemd service..."
cat > /etc/systemd/system/easytax-api.service << 'EOF'
[Unit]
Description=EasyTax-AU API Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=easytax
Group=easytax
WorkingDirectory=/opt/easytax-au
EnvironmentFile=/opt/easytax-au/.env

ExecStart=/usr/bin/node dist/main.js

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=easytax-api

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/easytax-au

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable easytax-api
echo "  ✓ Systemd service created and enabled"

echo ""
echo "Step 10/10: Configuring nginx..."
# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create EasyTax-AU nginx config
cat > /etc/nginx/sites-available/easytax-au << 'EOF'
# EasyTax-AU nginx Configuration

# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml;

server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /opt/easytax-au/web/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy /api requests to backend
    location /api {
        rewrite ^/api/(.*) /$1 break;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # index.html with no caching
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/easytax-au /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx
echo "  ✓ nginx configured and started"

echo ""
echo "Starting services..."
systemctl start easytax-api

# Wait for API to start
echo -n "  Waiting for API to start"
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "Verifying services..."
API_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "FAILED")
WEB_HEALTH=$(curl -s http://localhost/health 2>/dev/null || echo "FAILED")

if [[ "$API_HEALTH" != "FAILED" ]]; then
    echo "  ✓ API is responding"
else
    echo "  ✗ API is not responding (check logs: journalctl -u easytax-api)"
fi

if [[ "$WEB_HEALTH" == "OK" ]]; then
    echo "  ✓ Frontend is responding"
else
    echo "  ✗ Frontend is not responding (check logs: /var/log/nginx/error.log)"
fi

echo ""
echo "Creating health check script..."
cat > /usr/local/bin/easytax-health << 'EOF'
#!/bin/bash
echo "=== EasyTax-AU Health Check ==="
echo ""

echo "API Health:"
API_HEALTH=$(curl -s http://localhost:3000/health)
if [[ $? -eq 0 ]]; then
    echo "✓ API responding: $API_HEALTH"
else
    echo "✗ API not responding"
fi
echo ""

echo "Frontend Health:"
WEB_HEALTH=$(curl -s http://localhost/health)
if [[ $? -eq 0 ]]; then
    echo "✓ Frontend responding"
else
    echo "✗ Frontend not responding"
fi
echo ""

echo "Services:"
systemctl is-active --quiet easytax-api && echo "✓ easytax-api running" || echo "✗ easytax-api stopped"
systemctl is-active --quiet nginx && echo "✓ nginx running" || echo "✗ nginx stopped"
EOF

chmod +x /usr/local/bin/easytax-health
echo "  ✓ Health check script created: easytax-health"

echo ""
echo "========================================"
echo "Application LXC Setup Complete!"
echo "========================================"
echo ""
echo "Services status:"
systemctl status easytax-api --no-pager -l
echo ""
systemctl status nginx --no-pager -l
echo ""

APP_IP=$(hostname -I | awk '{print $1}')

echo "Access the application:"
echo "  Frontend: http://$APP_IP"
echo "  API Swagger: http://$APP_IP/api/docs"
echo ""
echo "Useful commands:"
echo "  Health check: easytax-health"
echo "  View API logs: journalctl -u easytax-api -f"
echo "  Restart API: systemctl restart easytax-api"
echo "  Restart nginx: systemctl restart nginx"
echo ""
echo "Configuration saved to:"
echo "  Environment: $APP_DIR/.env"
echo "  Systemd service: /etc/systemd/system/easytax-api.service"
echo "  nginx config: /etc/nginx/sites-available/easytax-au"
echo ""
echo "Next steps:"
echo "  1. Access http://$APP_IP in your browser"
echo "  2. Create categories, providers, and clients in Settings"
echo "  3. Start adding expenses and incomes"
echo ""

# Save setup info
cat > /root/app-setup-info.txt << EOF
Application Setup Information
==============================
Application IP: $APP_IP
Application directory: $APP_DIR
Database host: $DB_HOST:5432
Current version: $CURRENT_VERSION

Frontend: http://$APP_IP
API Swagger: http://$APP_IP/api/docs

Encryption key: $ENCRYPTION_KEY

IMPORTANT: Backup this file and the .env file to a secure location!
EOF

chmod 600 /root/app-setup-info.txt
echo "Setup info saved to: /root/app-setup-info.txt"
echo ""
echo "⚠️  IMPORTANT: Backup /opt/easytax-au/.env - it contains the encryption key!"
echo ""
