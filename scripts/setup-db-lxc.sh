#!/bin/bash
#
# EasyTax-AU Database LXC Setup Script
#
# This script automates the setup of the PostgreSQL database container.
# Run this INSIDE the database LXC (e.g., LXC 101)
#
# Usage:
#   1. Copy this script to the database LXC
#   2. Run: chmod +x setup-db-lxc.sh
#   3. Run: ./setup-db-lxc.sh
#

set -e  # Exit on any error

echo "========================================"
echo "EasyTax-AU Database LXC Setup"
echo "========================================"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "Error: This script must be run as root"
   exit 1
fi

# Configuration
DB_NAME="easytax-au"
DB_USER="easytax"
APP_LXC_IP=""
DB_PASSWORD=""

# Prompt for configuration
echo "Configuration:"
echo ""
read -p "Enter the application LXC IP address (e.g., 192.168.1.102): " APP_LXC_IP
if [[ -z "$APP_LXC_IP" ]]; then
    echo "Error: Application LXC IP is required"
    exit 1
fi

read -s -p "Enter database password for user '$DB_USER': " DB_PASSWORD
echo ""
if [[ -z "$DB_PASSWORD" ]]; then
    echo "Error: Database password is required"
    exit 1
fi

read -s -p "Confirm database password: " DB_PASSWORD_CONFIRM
echo ""
if [[ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]]; then
    echo "Error: Passwords do not match"
    exit 1
fi

echo ""
echo "Configuration summary:"
echo "  Database name: $DB_NAME"
echo "  Database user: $DB_USER"
echo "  Application LXC IP: $APP_LXC_IP"
echo ""
read -p "Continue with installation? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
fi

echo ""
echo "Step 1/6: Updating system packages..."
apt update && apt upgrade -y

echo ""
echo "Step 2/6: Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

echo ""
echo "Step 3/6: Creating database and user..."
# Wait for PostgreSQL to fully start
sleep 2

# Create database
sudo -u postgres createdb "$DB_NAME" 2>/dev/null || echo "  Database already exists"

# Create user with password
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || \
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "  ✓ Database and user created"

echo ""
echo "Step 4/6: Configuring PostgreSQL to accept remote connections..."
# Configure PostgreSQL to listen on all interfaces
PG_CONF="/etc/postgresql/15/main/postgresql.conf"
if grep -q "^listen_addresses = '\*'" "$PG_CONF"; then
    echo "  Already configured to listen on all interfaces"
else
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
    sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
    echo "  ✓ Updated listen_addresses to '*'"
fi

echo ""
echo "Step 5/6: Configuring client authentication..."
# Configure pg_hba.conf to allow application LXC
PG_HBA="/etc/postgresql/15/main/pg_hba.conf"

# Check if rule already exists
if grep -q "$APP_LXC_IP" "$PG_HBA"; then
    echo "  Authentication rule already exists"
else
    # Add rule before the first "local" line
    sed -i "/^local/i # EasyTax-AU application LXC\nhost    $DB_NAME      $DB_USER         $APP_LXC_IP/32        scram-sha-256\n" "$PG_HBA"
    echo "  ✓ Added authentication rule for $APP_LXC_IP"
fi

# Restart PostgreSQL
systemctl restart postgresql
echo "  ✓ PostgreSQL restarted"

echo ""
echo "Step 6/6: Setting up automated backups..."
# Create backup directory
mkdir -p /root/backups

# Create backup script
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

# Add to crontab if not already present
if ! crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    (crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-database.sh >> /var/log/easytax-backup.log 2>&1") | crontab -
    echo "  ✓ Backup cron job added (daily at 2 AM)"
else
    echo "  Backup cron job already exists"
fi

# Test backup script
echo "  Running initial backup..."
/root/backup-database.sh
echo "  ✓ Initial backup completed"

echo ""
echo "========================================"
echo "Database LXC Setup Complete!"
echo "========================================"
echo ""
echo "PostgreSQL is now running and configured:"
echo "  - Database: $DB_NAME"
echo "  - User: $DB_USER"
echo "  - Listening on: 0.0.0.0:5432"
echo "  - Allows connections from: $APP_LXC_IP"
echo ""
echo "Automated backups:"
echo "  - Script: /root/backup-database.sh"
echo "  - Schedule: Daily at 2 AM"
echo "  - Location: /root/backups/"
echo "  - Retention: 30 days"
echo ""
echo "To test the database connection from the application LXC:"
echo "  psql -h $(hostname -I | awk '{print $1}') -U $DB_USER -d $DB_NAME"
echo ""
echo "Next step: Run setup-app-lxc.sh on the application LXC"
echo ""

# Save connection info for reference
cat > /root/db-connection-info.txt << EOF
Database Connection Information
================================
Host: $(hostname -I | awk '{print $1}')
Port: 5432
Database: $DB_NAME
User: $DB_USER
Password: $DB_PASSWORD

Application LXC IP: $APP_LXC_IP
EOF

chmod 600 /root/db-connection-info.txt
echo "Connection info saved to: /root/db-connection-info.txt"
echo ""
