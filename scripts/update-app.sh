#!/bin/bash
#
# EasyTax-AU Application Update Script
#
# This script updates the application to the latest version (or specific version).
# Run this INSIDE the application LXC as root.
#
# Usage:
#   ./update-app.sh              # Update to latest
#   ./update-app.sh v1.2.0       # Update to specific tag/commit
#

set -e  # Exit on any error

APP_DIR="/opt/easytax-au"
APP_USER="easytax"
TARGET_VERSION="${1:-origin/main}"

echo "========================================"
echo "EasyTax-AU Update Script"
echo "========================================"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "Error: This script must be run as root"
   exit 1
fi

# Check if app directory exists
if [[ ! -d "$APP_DIR" ]]; then
    echo "Error: Application directory not found: $APP_DIR"
    echo "Run setup-app-lxc.sh first"
    exit 1
fi

cd "$APP_DIR"

# Get current version
CURRENT_VERSION=$(git describe --tags --always 2>/dev/null || echo "unknown")
echo "Current version: $CURRENT_VERSION"

# Fetch latest changes
echo "Fetching updates..."
sudo -u "$APP_USER" git fetch origin

# Show available updates if updating to latest
if [[ "$TARGET_VERSION" == "origin/main" ]]; then
    echo ""
    echo "Available updates:"
    git log HEAD..origin/main --oneline || echo "  Already up to date"
    echo ""
    read -p "Continue with update? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Update cancelled"
        exit 0
    fi
fi

echo ""
echo "Step 1/5: Stopping API service..."
systemctl stop easytax-api
echo "  ✓ Service stopped"

echo ""
echo "Step 2/5: Updating code..."
if [[ "$TARGET_VERSION" == "origin/main" ]]; then
    sudo -u "$APP_USER" git pull origin main
else
    sudo -u "$APP_USER" git checkout "$TARGET_VERSION"
fi

NEW_VERSION=$(git describe --tags --always 2>/dev/null || echo "unknown")
echo "  ✓ Updated to: $NEW_VERSION"

echo ""
echo "Step 3/5: Installing dependencies..."
sudo -u "$APP_USER" pnpm install
echo "  ✓ Dependencies updated"

echo ""
echo "Step 4/5: Building application..."
sudo -u "$APP_USER" pnpm run build
echo "  ✓ Backend built"

sudo -u "$APP_USER" pnpm --filter web build
echo "  ✓ Frontend built"

echo ""
echo "Step 5/5: Starting API service..."
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
    if [[ $i -eq 30 ]]; then
        echo " ✗"
        echo ""
        echo "Warning: API did not start within 30 seconds"
        echo "Check logs: journalctl -u easytax-api -n 50"
        exit 1
    fi
done

echo ""
echo "Verifying services..."
API_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null || echo "FAILED")
if [[ "$API_HEALTH" != "FAILED" ]]; then
    echo "  ✓ API is responding"
else
    echo "  ✗ API check failed"
    journalctl -u easytax-api -n 20 --no-pager
    exit 1
fi

WEB_HEALTH=$(curl -s http://localhost/health 2>/dev/null || echo "FAILED")
if [[ "$WEB_HEALTH" == "OK" ]]; then
    echo "  ✓ Frontend is responding"
else
    echo "  ✗ Frontend check failed"
fi

echo ""
echo "========================================"
echo "Update Complete!"
echo "========================================"
echo ""
echo "Version: $CURRENT_VERSION → $NEW_VERSION"
echo ""
echo "The application is now running the updated version."
echo ""
echo "To rollback if needed:"
echo "  git reset --hard $CURRENT_VERSION"
echo "  systemctl restart easytax-api"
echo ""
