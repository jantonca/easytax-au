# /deploy - Deployment Guidance

## Purpose
Deployment workflow for Docker (dev/staging) and Proxmox LXC (production). Includes pre-deployment checklist and post-deployment verification.

## Context
Deployment target: $ARGUMENTS (dev / staging / production)

## Workflow

### 1. Pre-Deployment Checklist

**Read deployment docs:**
- `docs/core/DEPLOYMENT.md` (if exists, check first)
- `docs/core/BACKUP.md` - Understand backup/recovery strategy

**Verify readiness:**
- [ ] All tests pass: `pnpm --filter web test && pnpm run test`
- [ ] Linting passes: `pnpm --filter web lint && pnpm run lint`
- [ ] Build succeeds: `pnpm --filter web build && pnpm run build`
- [ ] Latest audit report reviewed (check `docs/reports/audit/`)
- [ ] No P0 or P1 issues unresolved
- [ ] Database migrations tested (if any)

**Check environment:**
- [ ] `.env` variables documented (compare `.env.example`)
- [ ] Secrets secured (not in git)
- [ ] Database connection strings correct for target environment

### 2. Deployment by Environment

---

#### Development (Docker Compose)

**Start services:**
```bash
docker-compose up -d
```

**Verify containers:**
```bash
docker-compose ps
docker-compose logs -f
```

**Health checks:**
- Backend: `curl http://localhost:3000/health`
- Frontend: `curl http://localhost:5173`
- Database: `docker exec -it easytax-db psql -U postgres -d easytax -c "SELECT 1;"`

**Run migrations:**
```bash
docker exec -it easytax-backend pnpm run migration:run
```

---

#### Staging (Docker)

**Build images:**
```bash
# Backend
docker build -t easytax-backend:staging -f backend/Dockerfile .

# Frontend
docker build -t easytax-web:staging -f web/Dockerfile .
```

**Tag & push (if using registry):**
```bash
docker tag easytax-backend:staging registry.example.com/easytax-backend:staging
docker push registry.example.com/easytax-backend:staging
```

**Deploy:**
```bash
docker-compose -f docker-compose.staging.yml up -d
```

**Verify:**
- Same health checks as dev
- Test with staging credentials
- Verify database encryption working

---

#### Production (Proxmox LXC)

**⚠️ CRITICAL: Production deployment requires extra caution**

**Pre-production steps:**
1. **Backup first:**
   ```bash
   # Follow BACKUP.md procedures
   # Verify backup integrity before proceeding
   ```

2. **Database migration dry-run:**
   ```bash
   pnpm run migration:show  # List pending migrations
   pnpm run migration:dry-run  # Test migration (if supported)
   ```

3. **Freeze deployment window:**
   - Notify users of maintenance window
   - Set read-only mode (if supported)

**LXC deployment:**
```bash
# SSH into Proxmox LXC container
ssh user@proxmox-lxc-ip

# Pull latest code
cd /opt/easytax-au
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm --filter web build
pnpm run build

# Run migrations (CRITICAL: Backup first!)
pnpm run migration:run

# Restart services
systemctl restart easytax-backend
systemctl restart easytax-web
```

**Verify:**
- [ ] Services running: `systemctl status easytax-backend easytax-web`
- [ ] Logs clean: `journalctl -u easytax-backend -f`
- [ ] Health endpoints: `curl https://yourdomain.com/api/health`
- [ ] Database queries working
- [ ] Encrypted fields readable
- [ ] User authentication working
- [ ] GST calculations correct (smoke test)

**Rollback plan (if needed):**
```bash
# Restore database from backup (see BACKUP.md)
# Revert code to previous version
git checkout [previous-commit-hash]
pnpm install --frozen-lockfile
pnpm --filter web build && pnpm run build
systemctl restart easytax-backend easytax-web
```

---

### 3. Post-Deployment Verification

**Functional smoke tests:**
- [ ] User login
- [ ] Create business
- [ ] Create transaction
- [ ] GST calculation displays correctly
- [ ] BAS report generates
- [ ] CSV import works (if testing)

**Performance checks:**
- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Database query times reasonable

**Security verification:**
- [ ] HTTPS working (production only)
- [ ] Authentication required for protected routes
- [ ] Encrypted fields not readable in database directly
- [ ] No exposed secrets in logs

**Monitoring:**
- [ ] Check application logs for errors
- [ ] Monitor CPU/memory usage
- [ ] Set up alerts (if not already configured)

### 4. Documentation Update

**Update deployment log:**
```bash
# Create entry in deployment log (if exists)
# Or add note to CHANGELOG.md
```

**Record:**
- Deployment date/time
- Version deployed
- Migration changes (if any)
- Issues encountered
- Rollback performed (if any)

## Output Format
```markdown
# Deployment: v[X.Y.Z] to [Environment]

**Date:** YYYY-MM-DD HH:MM
**Environment:** [Development / Staging / Production]
**Deployed by:** [Name]

---

## Pre-Deployment Checklist
- [x] Tests passed
- [x] Linting passed
- [x] Build succeeded
- [x] Audit reviewed (no P0/P1 issues)
- [x] Backup created (production only)

---

## Deployment Steps Executed
1. [Step description + command]
2. [Step description + command]

---

## Verification Results

**Health Checks:**
- Backend: [PASS / FAIL]
- Frontend: [PASS / FAIL]
- Database: [PASS / FAIL]

**Smoke Tests:**
- User login: [PASS / FAIL]
- Transaction creation: [PASS / FAIL]
- GST calculation: [PASS / FAIL]
- BAS report: [PASS / FAIL]

**Performance:**
- Page load: [X]s
- API response: [Y]ms

---

## Issues Encountered
[List any problems + how resolved]

---

## Rollback Performed
[Yes/No - if yes, describe steps]

---

## Next Steps
[Any follow-up actions needed]

---

## Deployment Status
**Overall:** [SUCCESS / PARTIAL / FAILED]
```

## Guardrails
- **NEVER** deploy to production without backup
- **NEVER** deploy with failing tests
- **NEVER** skip database migration testing
- **ALWAYS** verify encrypted fields after migration
- **ALWAYS** have rollback plan ready
- **FLAG** if deploying schema changes to encrypted columns
- **FLAG** if deploying during business hours (production)

## Australian Domain Context
- Deployment timing: Avoid end-of-quarter (BAS reporting periods)
- BAS quarters: Q1=Jul-Sep, Q2=Oct-Dec, Q3=Jan-Mar, Q4=Apr-Jun
- High-risk periods: June 30 (EOFY), BAS due dates (Oct 28, Feb 28, Apr 28, Jul 28)
