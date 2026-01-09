# Proxmox Multi-LXC Deployment Guide (No Docker)

**Target Environment:** Proxmox VE with LXC containers
**Deployment Method:** Native systemd services
**Architecture:** Database LXC + Application LXC

This guide provides the most efficient way to run EasyTax-AU on Proxmox by using native LXC containers without Docker overhead.

---

## Deployment Options

**Choose your deployment method:**

| Method | Time | Effort | Best For |
|--------|------|--------|----------|
| **🤖 Automated Scripts** | ~5 min | Easy | Quick setup, reproducible deployments |
| **📖 Manual Setup** | ~30 min | Detailed | Learning, customization, troubleshooting |

> **💡 Recommended:** Use the automated scripts for initial setup (see [Quick Start with Scripts](#quick-start-with-automation-scripts)). Use the manual guide below for understanding or troubleshooting.

---

## Quick Start with Automation Scripts

**For the fastest setup, use the provided automation scripts:**

1. **Create two LXC containers** in Proxmox (see [Prerequisites](#2-prerequisites) for specs)
2. **Run database setup:** Copy and run `scripts/setup-db-lxc.sh` in LXC 101
3. **Run application setup:** Copy and run `scripts/setup-app-lxc.sh` in LXC 102
4. **Done!** Access the app at `http://192.168.1.102`

**Detailed automation guide:** [scripts/README.md](../scripts/README.md)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [LXC 1: PostgreSQL Database](#3-lxc-1-postgresql-database)
4. [LXC 2: Application Server](#4-lxc-2-application-server)
5. [Initial Deployment](#5-initial-deployment)
6. [Updates & Versioning](#6-updates--versioning)
7. [Backups](#7-backups)
8. [Troubleshooting](#8-troubleshooting)
9. [Maintenance](#9-maintenance)

---

## 1. Architecture Overview

### Container Layout

```
┌─────────────────────────┐       ┌─────────────────────────┐
│  LXC 101: Database      │       │  LXC 102: Application   │
│  ─────────────────────  │       │  ─────────────────────  │
│                         │       │                         │
│  PostgreSQL 15          │◄──────┤  Node.js 20 API         │
│  Port: 5432             │       │  Port: 3000             │
│  IP: 192.168.1.101      │       │                         │
│                         │       │  nginx (frontend)       │
│  1 CPU, 1GB RAM         │       │  Port: 80               │
│  10GB disk              │       │  IP: 192.168.1.102      │
│                         │       │                         │
│                         │       │  2 CPU, 2GB RAM         │
│                         │       │  10GB disk              │
└─────────────────────────┘       └─────────────────────────┘
```

### Why This Approach?

**Performance Benefits:**
- No Docker daemon overhead (~500MB RAM saved)
- Direct systemd service management
- Native LXC performance (minimal overhead vs VM)

**Operational Benefits:**
- Independent container backups/snapshots
- Easier resource allocation per service
- Database isolation from application
- Simple networking (static IPs)

---

## 2. Prerequisites

### On Proxmox Host

- Proxmox VE 7.x or 8.x
- Ubuntu 22.04 LXC template downloaded
- Available IP addresses on your LAN (e.g., 192.168.1.101-102)

**Download Ubuntu template:**
```bash
# On Proxmox host shell
pveam update
pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst
```

---

## 3. LXC 1: PostgreSQL Database

### 3.1 Create Database Container

**In Proxmox UI:**
1. Create CT → Select Ubuntu 22.04 template
2. **Hostname:** `easytax-db`
3. **CT ID:** 101 (or your preferred ID)
4. **Root password:** Set a strong password
5. **Resources:**
   - CPU: 1 core
   - RAM: 1024 MB
   - Swap: 512 MB
   - Disk: 10 GB
6. **Network:**
   - Bridge: vmbr0
   - IPv4: Static - `192.168.1.101/24` (adjust to your network)
   - Gateway: `192.168.1.1` (your router IP)
7. **DNS:** `8.8.8.8` or your local DNS
8. **Start on boot:** ✅ (recommended)

**Start the container.**

### 3.2 Install PostgreSQL

SSH into the database container:
```bash
ssh root@192.168.1.101
```

Update system and install PostgreSQL:
```bash
# Update package lists
apt update && apt upgrade -y

# Install PostgreSQL 15
apt install postgresql postgresql-contrib -y

# Verify installation
psql --version
# Expected: psql (PostgreSQL) 15.x
```

### 3.3 Configure PostgreSQL

Create the database and user:
```bash
# Switch to postgres user
su - postgres

# Create database
createdb easytax-au

# Create user with password (replace with your secure password)
psql -c "CREATE USER easytax WITH ENCRYPTED PASSWORD 'your_secure_db_password_here';"

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE \"easytax-au\" TO easytax;"

# Grant schema permissions (required for TypeORM)
psql -d easytax-au -c "GRANT ALL ON SCHEMA public TO easytax;"

# Exit postgres user
exit
```

Configure PostgreSQL to accept connections from application LXC:
```bash
# Edit PostgreSQL config to listen on all interfaces
nano /etc/postgresql/15/main/postgresql.conf

# Find and change:
listen_addresses = '*'

# Save and exit (Ctrl+X, Y, Enter)
```

Configure client authentication:
```bash
# Edit pg_hba.conf
nano /etc/postgresql/15/main/pg_hba.conf

# Add this line BEFORE the "local all all peer" line:
# Allow application LXC (192.168.1.102) to connect
host    easytax-au      easytax         192.168.1.102/32        scram-sha-256

# Save and exit (Ctrl+X, Y, Enter)
```

Restart PostgreSQL:
```bash
systemctl restart postgresql
systemctl status postgresql

# Verify it's listening
ss -tlnp | grep 5432
# Should show: 0.0.0.0:5432 and :::5432
```

### 3.4 Test Database Connection

```bash
# Test local connection
su - postgres
psql -d easytax-au -c "SELECT version();"
exit

# Expected: PostgreSQL version string
```

**Database container setup complete!** ✅

---

## 4. LXC 2: Application Server

### 4.1 Create Application Container

**In Proxmox UI:**
1. Create CT → Select Ubuntu 22.04 template
2. **Hostname:** `easytax-app`
3. **CT ID:** 102 (or your preferred ID)
4. **Root password:** Set a strong password
5. **Resources:**
   - CPU: 2 cores
   - RAM: 2048 MB
   - Swap: 512 MB
   - Disk: 10 GB
6. **Network:**
   - Bridge: vmbr0
   - IPv4: Static - `192.168.1.102/24`
   - Gateway: `192.168.1.1`
7. **DNS:** `8.8.8.8` or your local DNS
8. **Start on boot:** ✅ (recommended)

**Start the container.**

### 4.2 Install Prerequisites

SSH into the application container:
```bash
ssh root@192.168.1.102
```

Install Node.js, pnpm, nginx, and git:
```bash
# Update system
apt update && apt upgrade -y

# Install required packages
apt install curl git build-essential nginx postgresql-client -y

# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Verify Node.js
node --version  # Should show v20.x
npm --version

# Enable and install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Verify pnpm
pnpm --version
```

### 4.3 Create Application User

For security, run the app as non-root user:
```bash
# Create easytax user
useradd -m -s /bin/bash easytax

# Create app directory
mkdir -p /opt/easytax-au
chown easytax:easytax /opt/easytax-au
```

### 4.4 Clone and Build Application

Switch to easytax user and set up the application:
```bash
# Switch to easytax user
su - easytax

# Clone repository
cd /opt/easytax-au
git clone https://github.com/YOUR_USERNAME/easytax-au.git .

# Note current version
git describe --tags --always

# Install dependencies
pnpm install

# Exit easytax user (back to root)
exit
```

### 4.5 Configure Environment

Create production environment file:
```bash
# As root
cat > /opt/easytax-au/.env << 'EOF'
# Database Configuration
DB_HOST=192.168.1.101
DB_PORT=5432
DB_USERNAME=easytax
DB_PASSWORD=your_secure_db_password_here
DB_NAME=easytax-au

# Application Configuration
NODE_ENV=production
PORT=3000

# Security Configuration
ENCRYPTION_KEY=REPLACE_WITH_64_CHAR_HEX_KEY
EOF

# Generate encryption key
openssl rand -hex 32

# Edit .env and paste the encryption key
nano /opt/easytax-au/.env
# Replace ENCRYPTION_KEY value with generated key
# Replace DB_PASSWORD with the password you set in section 3.3

# Set permissions
chown easytax:easytax /opt/easytax-au/.env
chmod 600 /opt/easytax-au/.env
```

### 4.6 Build Application

```bash
# Switch to easytax user
su - easytax
cd /opt/easytax-au

# Build backend
pnpm run build

# Build frontend
pnpm --filter web build

# Exit easytax user
exit
```

### 4.7 Create Systemd Service for API

```bash
# As root
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

# Node.js is in /usr/bin
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

# Reload systemd
systemctl daemon-reload

# Enable service (start on boot)
systemctl enable easytax-api

# Start service
systemctl start easytax-api

# Check status
systemctl status easytax-api

# View logs
journalctl -u easytax-api -f
# Press Ctrl+C to exit logs
```

**Verify API is running:**
```bash
curl http://localhost:3000/health

# Expected output:
# {"status":"ok","database":"connected","timestamp":"2026-01-09T..."}
```

### 4.8 Configure nginx for Frontend

Remove default nginx config and create EasyTax config:
```bash
# Remove default site
rm /etc/nginx/sites-enabled/default

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
        # Remove /api prefix before forwarding
        rewrite ^/api/(.*) /$1 break;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
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
ln -s /etc/nginx/sites-available/easytax-au /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl status nginx
```

### 4.9 Update Frontend API URL

The frontend needs to know to use `/api` prefix:
```bash
# Check if web/.env exists
ls -la /opt/easytax-au/web/.env

# If it exists, update it:
echo "VITE_API_URL=/api" > /opt/easytax-au/web/.env

# Rebuild frontend with correct API URL
su - easytax
cd /opt/easytax-au
pnpm --filter web build
exit

# Note: Frontend build bakes API_URL into JavaScript
# Future updates need rebuild if API URL changes
```

**Application container setup complete!** ✅

---

## 5. Initial Deployment

### 5.1 Test Database Connection from App LXC

```bash
# On application LXC (192.168.1.102)
psql -h 192.168.1.101 -U easytax -d easytax-au

# Enter password when prompted
# If successful, you'll see: easytax-au=>

# Test query
SELECT version();

# Exit
\q
```

**If connection fails:**
- Check firewall on database LXC: `ufw status` (should be inactive or allow 5432)
- Verify pg_hba.conf has the application IP
- Check PostgreSQL is listening: `ss -tlnp | grep 5432` on DB LXC

### 5.2 Verify All Services

**On application LXC (192.168.1.102):**
```bash
# Check API service
systemctl status easytax-api
journalctl -u easytax-api --since "5 minutes ago"

# Check nginx
systemctl status nginx

# Test API health
curl http://localhost:3000/health

# Test frontend
curl http://localhost/health
```

### 5.3 Access Application

**From your computer:**
```bash
# Frontend
http://192.168.1.102

# API Swagger docs
http://192.168.1.102/api/docs

# Or if you set up DNS:
http://easytax-app.local
```

### 5.4 Initial Data Setup

Same as Docker deployment:

1. **Create Categories** (Settings → Categories)
2. **Create Providers** (Settings → Providers)
3. **Create Clients** (Settings → Clients)
4. **Add Expenses/Incomes** or import CSV

---

## 6. Updates & Versioning

### 6.1 Update to Latest Version

**🤖 Automated Method (Recommended):**

Use the provided update script:
```bash
# On application LXC (192.168.1.102)
/root/update-app.sh

# Or update to specific version:
/root/update-app.sh v1.2.0
```

The script handles everything: stop service, update code, rebuild, restart, and verify health.

**Downtime:** ~30-60 seconds

---

**📖 Manual Method:**

**On application LXC (192.168.1.102):**
```bash
# Stop API service
systemctl stop easytax-api

# Switch to easytax user
su - easytax
cd /opt/easytax-au

# Fetch latest code
git fetch origin
git pull origin main

# Install new dependencies (if any)
pnpm install

# Rebuild backend
pnpm run build

# Rebuild frontend
pnpm --filter web build

# Exit easytax user
exit

# Start API service
systemctl start easytax-api

# Verify
systemctl status easytax-api
journalctl -u easytax-api -f

# Test
curl http://localhost:3000/health
```

**Downtime:** ~30-60 seconds

### 6.2 Update to Specific Version

```bash
# Stop API
systemctl stop easytax-api

su - easytax
cd /opt/easytax-au

# List available tags
git tag -l

# Checkout specific version
git checkout v1.2.0

# Rebuild
pnpm install
pnpm run build
pnpm --filter web build

exit

# Start API
systemctl start easytax-api
```

### 6.3 Rollback to Previous Version

```bash
systemctl stop easytax-api

su - easytax
cd /opt/easytax-au

# View commit history
git log --oneline -10

# Rollback
git reset --hard <commit-hash>

# Rebuild
pnpm install
pnpm run build
pnpm --filter web build

exit

systemctl start easytax-api
```

### 6.4 Zero-Downtime Updates (Optional)

For advanced users who want no downtime:

1. Clone to a new directory: `/opt/easytax-au-new`
2. Build the new version
3. Update systemd service to point to new directory
4. Reload systemd and restart service (fast switch)
5. Delete old directory after verification

---

## 7. Backups

### 7.1 Database Backups (Automated)

**On database LXC (192.168.1.101):**

Create backup script:
```bash
mkdir -p /root/backups

cat > /root/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=30

# Create backup
su - postgres -c "pg_dump easytax-au" > ${BACKUP_DIR}/easytax-db-${DATE}.sql

# Compress
gzip ${BACKUP_DIR}/easytax-db-${DATE}.sql

# Delete old backups
find ${BACKUP_DIR} -name "easytax-db-*.sql.gz" -mtime +${KEEP_DAYS} -delete

echo "Backup completed: easytax-db-${DATE}.sql.gz"
EOF

chmod +x /root/backup-database.sh

# Test backup
/root/backup-database.sh

# Verify
ls -lh /root/backups/

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-database.sh >> /var/log/easytax-backup.log 2>&1") | crontab -
```

### 7.2 Application Backups

**On application LXC (192.168.1.102):**

Backup critical files:
```bash
mkdir -p /root/backups

cat > /root/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d-%H%M%S)

# Backup .env file (contains encryption key)
cp /opt/easytax-au/.env ${BACKUP_DIR}/env-${DATE}.backup

# Set restrictive permissions
chmod 600 ${BACKUP_DIR}/env-${DATE}.backup

echo "App config backed up: env-${DATE}.backup"
EOF

chmod +x /root/backup-app.sh

# Run weekly (Sundays at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /root/backup-app.sh >> /var/log/easytax-backup.log 2>&1") | crontab -
```

### 7.3 Proxmox Snapshots

**Best practice:** Use Proxmox's built-in snapshot feature

**In Proxmox UI:**
1. Select container (101 or 102)
2. Snapshots → Take Snapshot
3. Name: `before-update-2026-01-09`
4. Description: "Before updating to v1.2.0"

**Restore from snapshot:**
1. Stop container
2. Snapshots → Select snapshot → Rollback
3. Start container

**Automated snapshots:**
```bash
# On Proxmox host
# Snapshot DB container before daily backup
0 1 * * * /usr/sbin/vzdump 101 --mode snapshot --storage local --compress gzip --mailto your@email.com

# Snapshot app container weekly
0 1 * * 0 /usr/sbin/vzdump 102 --mode snapshot --storage local --compress gzip
```

### 7.4 Restore Database from Backup

**On database LXC (192.168.1.101):**
```bash
# Stop application first (to avoid conflicts)
# On app LXC: systemctl stop easytax-api

# On DB LXC:
# Decompress backup
gunzip /root/backups/easytax-db-20260109-020000.sql.gz

# Drop and recreate database (CAREFUL!)
su - postgres
dropdb easytax-au
createdb easytax-au
psql easytax-au < /root/backups/easytax-db-20260109-020000.sql

# Restore permissions
psql -c "GRANT ALL PRIVILEGES ON DATABASE \"easytax-au\" TO easytax;"
psql -d easytax-au -c "GRANT ALL ON SCHEMA public TO easytax;"

exit

# Start application
# On app LXC: systemctl start easytax-api
```

### 7.5 Offsite Backups

**Recommended:** Use `rsync` or `rclone` to sync backups offsite

**Example with rsync to NAS:**
```bash
# On database LXC
cat > /root/sync-backups.sh << 'EOF'
#!/bin/bash
rsync -avz --delete /root/backups/ user@nas.local:/volume1/backups/easytax-db/
EOF

chmod +x /root/sync-backups.sh

# Run after daily backup (2:30 AM)
(crontab -l 2>/dev/null; echo "30 2 * * * /root/sync-backups.sh >> /var/log/easytax-backup.log 2>&1") | crontab -
```

---

## 8. Troubleshooting

### 8.1 API Service Won't Start

```bash
# Check service status
systemctl status easytax-api

# View logs
journalctl -u easytax-api -n 100 --no-pager

# Common issues:
```

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Missing dependencies | `su - easytax && cd /opt/easytax-au && pnpm install` |
| `ECONNREFUSED 192.168.1.101:5432` | Database not accessible | Check DB is running, firewall, pg_hba.conf |
| `ENCRYPTION_KEY must be 64 characters` | Invalid encryption key | Regenerate: `openssl rand -hex 32` |
| `Port 3000 already in use` | Another process using port | `lsof -i :3000`, kill process or change PORT in .env |

### 8.2 Database Connection Failed

**Test from app LXC:**
```bash
# Ping database LXC
ping 192.168.1.101

# Test PostgreSQL port
telnet 192.168.1.101 5432

# Or use psql
psql -h 192.168.1.101 -U easytax -d easytax-au
```

**If connection fails:**

**On database LXC (101):**
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check it's listening on all interfaces
ss -tlnp | grep 5432
# Should show: 0.0.0.0:5432

# Check pg_hba.conf
cat /etc/postgresql/15/main/pg_hba.conf | grep 192.168.1.102

# Check firewall
ufw status
# If enabled, allow: ufw allow from 192.168.1.102 to any port 5432
```

### 8.3 Frontend Shows Blank Page

```bash
# Check nginx is running
systemctl status nginx

# Check nginx logs
tail -f /var/log/nginx/error.log

# Verify frontend files exist
ls -la /opt/easytax-au/web/dist/

# Test nginx config
nginx -t

# Rebuild frontend if files missing
su - easytax
cd /opt/easytax-au
pnpm --filter web build
exit

systemctl restart nginx
```

### 8.4 Frontend Shows "Failed to Fetch" Errors

This means the frontend can't reach the API.

```bash
# Check API is running
curl http://localhost:3000/health

# Check nginx proxy config
cat /etc/nginx/sites-available/easytax-au | grep -A 5 "location /api"

# Test API through nginx
curl http://localhost/api/health

# Check browser console for exact error
# If it's a CORS error, check API CORS settings
```

### 8.5 View Resource Usage

```bash
# On Proxmox host
pct exec 101 -- top      # Database LXC
pct exec 102 -- top      # Application LXC

# Inside each LXC:
htop                     # Install: apt install htop

# Check disk usage
df -h

# Check memory usage
free -h
```

---

## 9. Maintenance

### 9.1 View Logs

**API logs:**
```bash
# Recent logs (last 50 lines)
journalctl -u easytax-api -n 50 --no-pager

# Follow logs (real-time)
journalctl -u easytax-api -f

# Logs since specific time
journalctl -u easytax-api --since "1 hour ago"
journalctl -u easytax-api --since "2026-01-09 10:00:00"

# Filter by error level
journalctl -u easytax-api -p err
```

**nginx logs:**
```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log

# Filter by client IP
grep "192.168.1.50" /var/log/nginx/access.log
```

**PostgreSQL logs:**
```bash
# On database LXC
tail -f /var/log/postgresql/postgresql-15-main.log

# Or via journalctl
journalctl -u postgresql -f
```

### 9.2 Restart Services

```bash
# Restart API
systemctl restart easytax-api

# Restart nginx
systemctl restart nginx

# Restart PostgreSQL (on DB LXC)
systemctl restart postgresql

# Restart entire application LXC from Proxmox host
pct reboot 102

# Restart database LXC from Proxmox host
pct reboot 101
```

### 9.3 Service Health Checks

**Create health check script:**
```bash
cat > /usr/local/bin/easytax-health << 'EOF'
#!/bin/bash

echo "=== EasyTax-AU Health Check ==="
echo ""

# API Health
echo "API Health:"
API_HEALTH=$(curl -s http://localhost:3000/health)
if [[ $? -eq 0 ]]; then
    echo "✓ API responding: $API_HEALTH"
else
    echo "✗ API not responding"
fi
echo ""

# Frontend Health
echo "Frontend Health:"
WEB_HEALTH=$(curl -s http://localhost/health)
if [[ $? -eq 0 ]]; then
    echo "✓ Frontend responding"
else
    echo "✗ Frontend not responding"
fi
echo ""

# Database Connection (from app)
echo "Database Connection:"
DB_CHECK=$(psql -h 192.168.1.101 -U easytax -d easytax-au -c "SELECT 1;" 2>&1)
if [[ $? -eq 0 ]]; then
    echo "✓ Database connected"
else
    echo "✗ Database connection failed"
fi
echo ""

# Service Status
echo "Services:"
systemctl is-active --quiet easytax-api && echo "✓ easytax-api running" || echo "✗ easytax-api stopped"
systemctl is-active --quiet nginx && echo "✓ nginx running" || echo "✗ nginx stopped"
EOF

chmod +x /usr/local/bin/easytax-health

# Run health check
easytax-health
```

### 9.4 Database Maintenance

**On database LXC:**
```bash
# Database size
su - postgres
psql -d easytax-au -c "SELECT pg_size_pretty(pg_database_size('easytax-au'));"

# Table sizes
psql -d easytax-au -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Vacuum (optimize and reclaim space)
psql -d easytax-au -c "VACUUM ANALYZE;"

# Reindex (if performance degrades)
psql -d easytax-au -c "REINDEX DATABASE \"easytax-au\";"

exit
```

### 9.5 System Updates

**Update both LXCs regularly:**

```bash
# On each LXC (101 and 102)
apt update
apt list --upgradable

# Apply updates
apt upgrade -y

# Reboot if kernel updated (from Proxmox host)
pct reboot 101
pct reboot 102
```

**After system updates, verify services:**
```bash
# On app LXC
systemctl status easytax-api
systemctl status nginx
easytax-health

# On DB LXC
systemctl status postgresql
```

---

## 10. Advanced: HTTPS with Reverse Proxy

If you want HTTPS, set up a reverse proxy (Traefik, nginx, Caddy) on another LXC or your router.

**Example with nginx reverse proxy:**

**Create LXC 103: Reverse Proxy**
- nginx with Let's Encrypt (certbot)
- Proxies to `http://192.168.1.102` (app LXC)
- Handles SSL termination

**Basic nginx reverse proxy config:**
```nginx
server {
    listen 443 ssl http2;
    server_name easytax.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/easytax.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/easytax.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://192.168.1.102;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name easytax.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 11. Performance Tuning

### 11.1 PostgreSQL Tuning

**On database LXC**, edit PostgreSQL config:
```bash
nano /etc/postgresql/15/main/postgresql.conf

# Adjust these based on available RAM (1GB container):
shared_buffers = 256MB           # 25% of RAM
effective_cache_size = 768MB     # 75% of RAM
maintenance_work_mem = 64MB
work_mem = 4MB

# Connection settings
max_connections = 50

# Restart PostgreSQL
systemctl restart postgresql
```

### 11.2 Node.js Tuning

**On application LXC**, adjust Node.js memory if needed:
```bash
nano /etc/systemd/system/easytax-api.service

# Add under [Service]:
Environment="NODE_OPTIONS=--max-old-space-size=1024"

# Reload and restart
systemctl daemon-reload
systemctl restart easytax-api
```

### 11.3 nginx Tuning

```bash
nano /etc/nginx/nginx.conf

# Adjust worker connections
events {
    worker_connections 1024;
}

# Add to http block:
http {
    # ... existing config ...

    # Connection keepalive
    keepalive_timeout 65;

    # Client body size (for CSV uploads)
    client_max_body_size 10M;
}

# Test and reload
nginx -t
systemctl reload nginx
```

---

## 12. Quick Reference

### Container IPs
- **Database:** 192.168.1.101
- **Application:** 192.168.1.102

### Service Commands (App LXC)
```bash
systemctl status easytax-api      # Check status
systemctl restart easytax-api     # Restart
systemctl stop easytax-api        # Stop
systemctl start easytax-api       # Start
journalctl -u easytax-api -f      # View logs
```

### File Locations
| Item | Location |
|------|----------|
| Application code | `/opt/easytax-au` |
| Environment config | `/opt/easytax-au/.env` |
| Frontend build | `/opt/easytax-au/web/dist` |
| API service | `/etc/systemd/system/easytax-api.service` |
| nginx config | `/etc/nginx/sites-available/easytax-au` |
| API logs | `journalctl -u easytax-api` |
| nginx logs | `/var/log/nginx/` |
| Database backups | `/root/backups/` (DB LXC) |

### Update Procedure
```bash
systemctl stop easytax-api
su - easytax
cd /opt/easytax-au
git pull
pnpm install
pnpm run build
pnpm --filter web build
exit
systemctl start easytax-api
```

### Backup Commands
```bash
# Database backup (on DB LXC)
/root/backup-database.sh

# App config backup (on App LXC)
/root/backup-app.sh

# Proxmox snapshot
vzdump 101 --mode snapshot
vzdump 102 --mode snapshot
```

---

**Last Updated:** 2026-01-09
