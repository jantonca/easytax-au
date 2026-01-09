# Production Deployment Guide

**Target Environment:** Proxmox LXC container
**Deployment Method:** Docker Compose
**Access Methods:** HTTPS via domain (Traefik) OR HTTP via LAN IP

---

## Table of Contents

1. [Proxmox LXC Setup](#1-proxmox-lxc-setup)
2. [Initial Deployment](#2-initial-deployment)
3. [Configuration](#3-configuration)
4. [First Run & Verification](#4-first-run--verification)
5. [Updates & Versioning](#5-updates--versioning)
6. [Backups](#6-backups)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Proxmox LXC Setup

### 1.1 Create LXC Container

**Recommended Specs:**
- **OS Template:** Ubuntu 22.04 or Debian 12
- **CPU:** 2 cores
- **RAM:** 2 GB (4 GB for heavy CSV imports)
- **Disk:** 20 GB (10 GB for app + 10 GB for database growth)
- **Network:** Bridge to your LAN (vmbr0)

**In Proxmox UI:**
1. Create CT → Select Ubuntu 22.04 template
2. Set hostname: `easytax-au`
3. Set root password (you'll need this)
4. Configure resources (2 CPU, 2048 MB RAM, 20 GB disk)
5. Network: DHCP or static IP on your LAN
6. **Important:** Enable "Nesting" feature (Options → Features → Nesting)
   - Required for Docker to work inside LXC

### 1.2 Install Prerequisites

SSH into the container:
```bash
ssh root@<container-ip>
```

Install Docker and dependencies:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Install git
apt install git -y

# Verify installations
docker --version
docker compose version
git --version
```

---

## 2. Initial Deployment

### 2.1 Clone Repository

```bash
# Create app directory
mkdir -p /opt/easytax-au
cd /opt/easytax-au

# Clone the repository
git clone https://github.com/YOUR_USERNAME/easytax-au.git .

# Note the current version
git describe --tags --always
```

### 2.2 Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Generate encryption key
openssl rand -hex 32

# Edit environment file
nano .env
```

**Minimal required configuration:**
```bash
# Database password (use a strong password)
DB_PASSWORD=your_strong_password_here

# Encryption key (paste the output from openssl command above)
ENCRYPTION_KEY=your_64_character_hex_key_from_openssl

# Node environment
NODE_ENV=production
```

**Save and exit** (Ctrl+X, Y, Enter)

---

## 3. Configuration

### 3.1 HTTP Access (LAN IP Only)

If you're accessing via LAN IP (e.g., `http://192.168.1.100`), no additional configuration needed. Skip to section 4.

### 3.2 HTTPS Access (Domain with Traefik)

If you have Traefik already set up and want HTTPS access:

```bash
nano .env
```

Add these lines:
```bash
# Enable Traefik integration
TRAEFIK_ENABLED=true
TRAEFIK_HOST=easytax.yourdomain.com

# Optional: Change web port if 80 is in use
WEB_PORT=8080
```

**Save and exit** (Ctrl+X, Y, Enter)

---

## 4. First Run & Verification

### 4.1 Start Services

```bash
# Build and start all services
docker compose up -d --build

# This will:
# 1. Build the NestJS API Docker image
# 2. Build the React frontend Docker image
# 3. Start PostgreSQL database
# 4. Start API backend (waits for DB to be healthy)
# 5. Start nginx frontend

# First build takes 5-10 minutes
```

### 4.2 Monitor Startup

```bash
# Watch logs from all services
docker compose logs -f

# Or watch individual services:
docker compose logs -f easytax-au-web    # Frontend
docker compose logs -f easytax-au-api    # Backend
docker compose logs -f easytax-au-db     # Database

# Press Ctrl+C to exit logs (services keep running)
```

**What to look for:**
- Database: `database system is ready to accept connections`
- API: `Nest application successfully started`
- Frontend: nginx starts without errors

### 4.3 Verify Services

```bash
# Check all containers are running
docker compose ps

# Should show 3 containers with "Up" status:
# - easytax-au-db
# - easytax-au-api
# - easytax-au-web
```

### 4.4 Test Access

**HTTP (LAN IP):**
```bash
# Get your container's IP
hostname -I

# Access in browser:
# http://<container-ip>          → Frontend
# http://<container-ip>:3000     → API (if exposed)
# http://<container-ip>/api/docs → Swagger documentation
```

**HTTPS (Domain with Traefik):**
```bash
# Access in browser:
# https://easytax.yourdomain.com          → Frontend
# https://easytax.yourdomain.com/api/docs → Swagger documentation
```

### 4.5 Initial Data Setup

On first run, the database is empty. You'll need to:

1. **Create Categories** (Settings → Categories)
   - Add expense categories with BAS labels (1B, G10, G11)
   - Example: "Software Subscriptions" (1B), "Fuel" (G10)

2. **Create Providers** (Settings → Providers)
   - Add your expense vendors
   - Mark international providers (0% GST)

3. **Create Clients** (Settings → Clients)
   - Add your income clients
   - Enter ABNs and PSI eligibility

4. **Add Expenses/Incomes** or **Import CSV**

---

## 5. Updates & Versioning

### 5.1 Check Current Version

```bash
cd /opt/easytax-au

# Show current version
git describe --tags --always

# Show recent commits
git log --oneline -5
```

### 5.2 Update to Latest Version

```bash
cd /opt/easytax-au

# Fetch latest changes
git fetch origin

# Show available updates
git log HEAD..origin/main --oneline

# Pull latest code
git pull origin main

# Rebuild and restart services
docker compose down
docker compose up -d --build

# Monitor startup
docker compose logs -f
```

**Downtime:** ~2-3 minutes during rebuild

### 5.3 Update to Specific Version/Tag

```bash
cd /opt/easytax-au

# List available tags
git tag -l

# Checkout specific version
git checkout v1.2.0

# Rebuild services
docker compose down
docker compose up -d --build
```

### 5.4 Rollback to Previous Version

```bash
cd /opt/easytax-au

# View recent commits
git log --oneline -10

# Rollback to previous commit
git reset --hard <commit-hash>

# Rebuild services
docker compose down
docker compose up -d --build
```

### 5.5 Database Migrations

EasyTax-AU uses TypeORM with automatic synchronization in production mode. Database schema changes are applied automatically on startup.

**Important:** Always backup your database before updating (see section 6).

If migrations fail:
```bash
# Check API logs for migration errors
docker compose logs easytax-au-api

# If needed, restore from backup (see section 6.3)
```

---

## 6. Backups

### 6.1 Manual Database Backup

```bash
# Create backup directory
mkdir -p /opt/easytax-au/backups

# Backup database (PostgreSQL dump)
docker exec easytax-au-db pg_dump -U postgres easytax-au > \
  /opt/easytax-au/backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file exists
ls -lh /opt/easytax-au/backups/
```

### 6.2 Automated Backups (Cron)

```bash
# Create backup script
cat > /opt/easytax-au/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/easytax-au/backups"
DATE=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=30

# Create backup
docker exec easytax-au-db pg_dump -U postgres easytax-au > \
  ${BACKUP_DIR}/backup-${DATE}.sql

# Delete backups older than 30 days
find ${BACKUP_DIR} -name "backup-*.sql" -mtime +${KEEP_DAYS} -delete

echo "Backup completed: backup-${DATE}.sql"
EOF

# Make script executable
chmod +x /opt/easytax-au/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/easytax-au/backup.sh >> /var/log/easytax-backup.log 2>&1") | crontab -

# Test backup script
/opt/easytax-au/backup.sh
```

### 6.3 Restore from Backup

```bash
# Stop the API (to avoid conflicts)
docker compose stop easytax-au-api

# Restore database
docker exec -i easytax-au-db psql -U postgres easytax-au < \
  /opt/easytax-au/backups/backup-20260109-140000.sql

# Restart services
docker compose start easytax-au-api
```

### 6.4 Backup Encryption Key

**Critical:** Your `ENCRYPTION_KEY` in `.env` is required to decrypt client names and ABNs.

```bash
# Backup .env file to secure location
cp /opt/easytax-au/.env /root/easytax-env-backup.txt

# Set restrictive permissions
chmod 600 /root/easytax-env-backup.txt
```

**Store this file offsite** (password manager, encrypted USB, etc.). Without it, encrypted data is unrecoverable.

### 6.5 Full Backup Strategy

For complete disaster recovery, backup these locations:

1. **Database:** `/opt/easytax-au/backups/*.sql` (automated via cron)
2. **Environment:** `/opt/easytax-au/.env` (contains encryption key)
3. **Docker Volume:** `easytax-au-pgdata` (optional, database dump is sufficient)

**Offsite Backup** (optional):
- Use `rsync`, `rclone`, or `restic` to sync `/opt/easytax-au/backups` to:
  - Another Proxmox host
  - NAS (Synology, TrueNAS)
  - Cloud storage (Backblaze B2, AWS S3)

See [docs/core/BACKUP.md](core/BACKUP.md) for advanced backup strategies.

---

## 7. Troubleshooting

### 7.1 Services Won't Start

**Check container status:**
```bash
docker compose ps

# If any service is "Exit 1" or "Restarting":
docker compose logs <service-name>
```

**Common issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| `DB_PASSWORD is required` | Missing `.env` file | Copy `.env.example` to `.env` and configure |
| `ENCRYPTION_KEY is required` | Missing encryption key | Generate with `openssl rand -hex 32` |
| `Connection refused (database)` | Database not ready | Wait 30 seconds, check `docker compose logs easytax-au-db` |
| `Port 80 already in use` | Another service using port | Change `WEB_PORT=8080` in `.env` |

### 7.2 Cannot Access Web UI

```bash
# Check if frontend container is running
docker compose ps easytax-au-web

# Check frontend logs
docker compose logs easytax-au-web

# Check nginx is serving on port 80
docker exec easytax-au-web wget -qO- http://localhost/health

# Expected output: OK
```

**If health check fails:**
```bash
# Restart frontend
docker compose restart easytax-au-web
```

### 7.3 API Errors (500 Internal Server Error)

```bash
# Check API logs
docker compose logs easytax-au-api --tail 100

# Common issues:
# - Database connection failed → Check DB_HOST is "easytax-au-db" in docker-compose.yml
# - Encryption key invalid → Verify ENCRYPTION_KEY is 64 hex characters
# - TypeORM sync failed → Check logs for migration errors
```

### 7.4 Database Connection Issues

```bash
# Test database connectivity from API container
docker exec easytax-au-api pg_isready -h easytax-au-db -U postgres

# Expected output: easytax-au-db:5432 - accepting connections

# If failed:
docker compose restart easytax-au-db

# Wait for health check (30 seconds)
docker compose logs easytax-au-db
```

### 7.5 Disk Space Issues

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up old Docker images (saves space)
docker image prune -a

# Clean up stopped containers and unused networks
docker system prune
```

### 7.6 View Real-Time Resource Usage

```bash
# Monitor container resource usage
docker stats

# Shows CPU, memory, network I/O for all containers
# Press Ctrl+C to exit
```

### 7.7 Reset Everything (Nuclear Option)

**Warning:** This deletes ALL data including the database.

```bash
cd /opt/easytax-au

# Stop and remove all containers, networks, and volumes
docker compose down -v

# Remove all images
docker rmi $(docker images -q easytax-au*)

# Start fresh
docker compose up -d --build
```

---

## 8. Maintenance Tasks

### 8.1 View Logs

```bash
# All services (last 100 lines)
docker compose logs --tail 100

# Specific service
docker compose logs -f easytax-au-api

# Filter by time
docker compose logs --since 1h
docker compose logs --since "2026-01-09T10:00:00"
```

### 8.2 Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart easytax-au-api
docker compose restart easytax-au-web

# Stop all services
docker compose stop

# Start all services
docker compose start
```

### 8.3 Check Service Health

```bash
# Frontend health check
curl http://localhost/health
# Expected: OK

# API health check
curl http://localhost:3000/health
# Expected: {"status":"ok","database":"connected","timestamp":"2026-01-09T..."}

# Database health check
docker exec easytax-au-db pg_isready -U postgres
# Expected: /var/run/postgresql:5432 - accepting connections
```

### 8.4 Database Maintenance

```bash
# Check database size
docker exec easytax-au-db psql -U postgres -d easytax-au -c \
  "SELECT pg_size_pretty(pg_database_size('easytax-au'));"

# Vacuum database (reclaim space, optimize)
docker exec easytax-au-db psql -U postgres -d easytax-au -c "VACUUM ANALYZE;"

# List all tables
docker exec easytax-au-db psql -U postgres -d easytax-au -c "\dt"
```

---

## 9. Security Hardening (Optional)

### 9.1 Firewall Rules (iptables/ufw)

If exposing to internet or untrusted networks:

```bash
# Install ufw
apt install ufw

# Allow SSH (important - don't lock yourself out!)
ufw allow 22/tcp

# Allow HTTP (if using Traefik)
ufw allow 80/tcp
ufw allow 443/tcp

# Or allow specific IP range (LAN only)
ufw allow from 192.168.1.0/24 to any port 80

# Enable firewall
ufw enable

# Check status
ufw status
```

### 9.2 Restrict Database Port

By default, PostgreSQL port 5432 is exposed. If you don't need external access:

```bash
nano docker-compose.yml

# Comment out or remove the ports section for easytax-au-db:
# ports:
#   - '${DB_PORT:-5432}:5432'

# Restart services
docker compose down
docker compose up -d
```

### 9.3 Change Default Ports

```bash
nano .env

# Change web port (if 80 conflicts or you want to hide it)
WEB_PORT=8080

# Change API port (if 3000 conflicts)
PORT=3001

# Restart services
docker compose down
docker compose up -d
```

---

## 10. Quick Reference

### Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Update application
git pull && docker compose down && docker compose up -d --build

# Backup database
docker exec easytax-au-db pg_dump -U postgres easytax-au > backup.sql

# Restore database
docker exec -i easytax-au-db psql -U postgres easytax-au < backup.sql

# Check health
curl http://localhost/health
curl http://localhost:3000/health
```

### File Locations

| Item | Location |
|------|----------|
| Application code | `/opt/easytax-au` |
| Environment config | `/opt/easytax-au/.env` |
| Database backups | `/opt/easytax-au/backups/` |
| Database volume | `/var/lib/docker/volumes/easytax-au-pgdata` |
| Docker Compose file | `/opt/easytax-au/docker-compose.yml` |
| Frontend config | `/opt/easytax-au/web/nginx.conf` |

### Support & Documentation

- **Core Docs:** `docs/core/` (ARCHITECTURE.md, SCHEMA.md, SECURITY.md)
- **Backup Guide:** `docs/core/BACKUP.md`
- **Frontend Guide:** `README.md` (Frontend Development section)
- **API Docs:** `http://<your-ip>/api/docs` (Swagger UI)

---

**Last Updated:** 2026-01-09
