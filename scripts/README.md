# EasyTax-AU Automation Scripts

This directory contains automation scripts for deploying and managing EasyTax-AU on Proxmox LXC containers.

---

## Available Scripts

| Script | Purpose | Run Where | When to Use |
|--------|---------|-----------|-------------|
| `setup-db-lxc.sh` | Set up PostgreSQL database | Database LXC (101) | First-time database setup |
| `setup-app-lxc.sh` | Set up Node.js application | Application LXC (102) | First-time application setup |
| `update-app.sh` | Update to latest/specific version | Application LXC (102) | When updating the app |

---

## Quick Start: Fresh Deployment

### Prerequisites

1. **Two LXC containers created** in Proxmox:
   - LXC 101 (Database): Ubuntu 22.04, 1 CPU, 1GB RAM, Static IP `192.168.1.101`
   - LXC 102 (Application): Ubuntu 22.04, 2 CPU, 2GB RAM, Static IP `192.168.1.102`

2. **Both containers started** and accessible via SSH

### Step 1: Set Up Database LXC

Copy and run the database setup script:

```bash
# On your computer, copy script to database LXC
scp setup-db-lxc.sh root@192.168.1.101:/root/

# SSH into database LXC
ssh root@192.168.1.101

# Run setup script
chmod +x /root/setup-db-lxc.sh
/root/setup-db-lxc.sh
```

**What it does:**
- Installs PostgreSQL 15
- Creates `easytax-au` database and `easytax` user
- Configures remote access from application LXC
- Sets up automated daily backups (2 AM)
- Creates initial backup

**You will be prompted for:**
- Application LXC IP address (e.g., `192.168.1.102`)
- Database password (choose a strong password)

**Time:** ~2-3 minutes

### Step 2: Set Up Application LXC

Copy and run the application setup script:

```bash
# On your computer, copy script to application LXC
scp setup-app-lxc.sh root@192.168.1.102:/root/

# SSH into application LXC
ssh root@192.168.1.102

# Run setup script
chmod +x /root/setup-app-lxc.sh
/root/setup-app-lxc.sh
```

**What it does:**
- Installs Node.js 20, pnpm, nginx, git
- Clones the repository
- Builds backend and frontend
- Creates systemd service
- Configures nginx
- Starts all services
- Generates encryption key
- Creates health check script

**You will be prompted for:**
- Database LXC IP address (e.g., `192.168.1.101`)
- Database password (from Step 1)
- Git repository URL (optional, defaults to GitHub repo)

**Time:** ~5-10 minutes (includes building the app)

### Step 3: Access Application

Once setup is complete:

```bash
# Frontend
http://192.168.1.102

# API Documentation
http://192.168.1.102/api/docs
```

---

## Updating the Application

### Update to Latest Version

```bash
# SSH into application LXC
ssh root@192.168.1.102

# Run update script
/root/update-app.sh
```

**What it does:**
- Stops API service
- Pulls latest code from Git
- Installs new dependencies
- Rebuilds backend and frontend
- Restarts API service
- Verifies health

**Downtime:** ~30-60 seconds

### Update to Specific Version

```bash
# Update to a specific Git tag
/root/update-app.sh v1.2.0

# Update to a specific commit
/root/update-app.sh abc123f
```

### Rollback After Failed Update

If an update fails and you need to rollback:

```bash
cd /opt/easytax-au

# View recent commits
git log --oneline -10

# Rollback to previous version
git reset --hard <previous-commit-hash>

# Rebuild and restart
pnpm install
pnpm run build
pnpm --filter web build
systemctl restart easytax-api
```

---

## Script Details

### setup-db-lxc.sh

**Full feature list:**
- ✅ System updates
- ✅ PostgreSQL 15 installation
- ✅ Database and user creation
- ✅ Remote connection configuration
- ✅ Client authentication setup (pg_hba.conf)
- ✅ Automated backup script creation
- ✅ Cron job for daily backups (2 AM)
- ✅ Initial backup execution
- ✅ Connection info saved to `/root/db-connection-info.txt`

**Security features:**
- Password input hidden (secure prompt)
- Connection restricted to application LXC IP only
- Uses scram-sha-256 authentication

**Post-install files:**
- `/root/backup-database.sh` - Manual backup script
- `/root/backups/` - Backup directory
- `/root/db-connection-info.txt` - Connection details (chmod 600)
- Cron job: Daily at 2 AM

**Test database connection:**
```bash
# From application LXC
psql -h 192.168.1.101 -U easytax -d easytax-au
```

---

### setup-app-lxc.sh

**Full feature list:**
- ✅ System updates
- ✅ Node.js 20 installation (via NodeSource)
- ✅ pnpm installation
- ✅ nginx installation
- ✅ Application user creation (`easytax`)
- ✅ Repository cloning
- ✅ Dependency installation
- ✅ Backend build
- ✅ Frontend build with `/api` proxy configuration
- ✅ Environment file creation with encryption key
- ✅ Systemd service creation with security hardening
- ✅ nginx configuration with gzip, caching, and SPA support
- ✅ Service startup and verification
- ✅ Health check script creation

**Security features:**
- Auto-generated encryption key (64-char hex)
- Application runs as non-root user (`easytax`)
- Systemd hardening (PrivateTmp, ProtectSystem, NoNewPrivileges)
- nginx security headers
- Environment file permissions (chmod 600)

**Post-install files:**
- `/opt/easytax-au/.env` - Environment configuration
- `/etc/systemd/system/easytax-api.service` - Systemd service
- `/etc/nginx/sites-available/easytax-au` - nginx config
- `/usr/local/bin/easytax-health` - Health check command
- `/root/app-setup-info.txt` - Setup details including encryption key

**Health check:**
```bash
# Run anytime to check service status
easytax-health
```

---

### update-app.sh

**Full feature list:**
- ✅ Version detection (current and new)
- ✅ Git fetch and update preview
- ✅ Confirmation prompt before update
- ✅ Graceful service stop
- ✅ Code update (git pull or checkout)
- ✅ Dependency installation
- ✅ Backend and frontend rebuild
- ✅ Service restart
- ✅ Health verification
- ✅ Rollback instructions on failure

**Usage patterns:**
```bash
# Latest version
./update-app.sh

# Specific tag
./update-app.sh v1.2.0

# Specific commit
./update-app.sh abc123f

# Specific branch
./update-app.sh origin/feature-branch
```

**Safety features:**
- Shows what will be updated before proceeding
- Waits for API to be healthy before declaring success
- Provides rollback command if update fails
- Exits on any error (set -e)

---

## Troubleshooting

### Database Setup Issues

**Problem:** Database setup fails with "connection refused"

**Solution:**
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check logs
journalctl -u postgresql -n 50
```

**Problem:** Application can't connect to database

**Solution:**
```bash
# On database LXC, verify configuration
cat /etc/postgresql/15/main/pg_hba.conf | grep easytax
ss -tlnp | grep 5432  # Should show 0.0.0.0:5432

# Test connection from app LXC
psql -h 192.168.1.101 -U easytax -d easytax-au
```

### Application Setup Issues

**Problem:** API service won't start

**Solution:**
```bash
# Check service status
systemctl status easytax-api

# View detailed logs
journalctl -u easytax-api -n 100

# Common issues:
# - Wrong database password in .env
# - Database not accessible (check network/firewall)
# - Missing dependencies (run: pnpm install)
```

**Problem:** Frontend shows blank page

**Solution:**
```bash
# Check if frontend files were built
ls -la /opt/easytax-au/web/dist/

# Rebuild frontend if missing
cd /opt/easytax-au
su - easytax
pnpm --filter web build
exit

# Restart nginx
systemctl restart nginx
```

**Problem:** Scripts fail with "permission denied"

**Solution:**
```bash
# Make scripts executable
chmod +x /root/setup-db-lxc.sh
chmod +x /root/setup-app-lxc.sh
chmod +x /root/update-app.sh
```

### Update Issues

**Problem:** Update script fails during build

**Solution:**
```bash
# Check for Node.js/pnpm issues
node --version  # Should be v20.x
pnpm --version

# Try manual update
cd /opt/easytax-au
systemctl stop easytax-api
git pull
pnpm install
pnpm run build
pnpm --filter web build
systemctl start easytax-api
```

**Problem:** API doesn't start after update

**Solution:**
```bash
# Check logs for errors
journalctl -u easytax-api -n 50

# Rollback to previous version
cd /opt/easytax-au
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit>
systemctl restart easytax-api
```

---

## Manual Operations

### Manual Backup (Database)

```bash
# On database LXC
/root/backup-database.sh

# Verify backup
ls -lh /root/backups/
```

### Manual Restore (Database)

```bash
# On database LXC
gunzip /root/backups/easytax-db-20260109-020000.sql.gz

# Stop app first
ssh root@192.168.1.102 "systemctl stop easytax-api"

# Restore
su - postgres
dropdb easytax-au
createdb easytax-au
psql easytax-au < /root/backups/easytax-db-20260109-020000.sql
exit

# Start app
ssh root@192.168.1.102 "systemctl start easytax-api"
```

### View Logs

```bash
# API logs (real-time)
journalctl -u easytax-api -f

# API logs (last 100 lines)
journalctl -u easytax-api -n 100

# nginx access log
tail -f /var/log/nginx/access.log

# nginx error log
tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart API
systemctl restart easytax-api

# Restart nginx
systemctl restart nginx

# Restart PostgreSQL (on DB LXC)
systemctl restart postgresql
```

---

## Customization

### Change IP Addresses

If you use different IPs than `192.168.1.101` and `192.168.1.102`:

1. **During setup:** Scripts will prompt for IPs
2. **After setup:** Edit configuration files:

```bash
# On application LXC, update .env
nano /opt/easytax-au/.env
# Change DB_HOST to your database IP

# Restart API
systemctl restart easytax-api
```

### Change Git Repository

Edit `setup-app-lxc.sh` before running:

```bash
# Change this line:
GIT_REPO="https://github.com/YOUR_USERNAME/easytax-au.git"
```

Or provide it when prompted during setup.

### Change Backup Schedule

```bash
# On database LXC, edit crontab
crontab -e

# Default: 0 2 * * * (daily at 2 AM)
# Change to 0 3 * * * for 3 AM
# Change to 0 */6 * * * for every 6 hours
```

### Change Backup Retention

Edit `/root/backup-database.sh` on database LXC:

```bash
nano /root/backup-database.sh

# Change this line:
KEEP_DAYS=30  # Change to desired retention (e.g., 60, 90)
```

---

## Best Practices

### Before Running Scripts

1. **Snapshot your LXCs** in Proxmox (quick rollback if needed)
2. **Verify network connectivity** between LXCs (`ping 192.168.1.101`)
3. **Have strong passwords ready** (database password, encryption key is auto-generated)

### After Setup

1. **Backup encryption key** - Saved in `/root/app-setup-info.txt` on app LXC
2. **Test backups** - Run restore procedure on a test container
3. **Set up Proxmox snapshots** - Schedule weekly snapshots of both LXCs
4. **Monitor logs** - Check logs weekly for errors

### Regular Maintenance

- **Weekly:** Check `journalctl -u easytax-api` for errors
- **Monthly:** Run `apt update && apt upgrade` on both LXCs
- **Quarterly:** Test database restore procedure

---

## Support

If you encounter issues not covered here:

1. Check the main deployment guide: [docs/DEPLOYMENT-PROXMOX-LXC.md](../docs/DEPLOYMENT-PROXMOX-LXC.md)
2. Review service logs: `journalctl -u easytax-api -n 100`
3. Run health check: `easytax-health`
4. Check GitHub issues: https://github.com/YOUR_USERNAME/easytax-au/issues

---

**Last Updated:** 2026-01-09
