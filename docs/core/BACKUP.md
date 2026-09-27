# Backup & Restore

**Updated:** 2026-09-27. This describes what actually runs; the live
specifics (CT IDs, hosts, off-box key location) are in the gitignored homelab
inventory referenced from `STATUS.md`.

## What runs today (Proxmox LXC deployment)

| Layer | What | Where | Retention |
|-------|------|-------|-----------|
| Container | Weekly Proxmox `vzdump` of both CTs (DB + app) | Proxmox backup storage | Per the host's vzdump job |
| Database | Daily `pg_dump` at 02:00 via `/root/backup-database.sh` (cron) | `/root/backups/easytax-db-*.sql.gz` **on the DB CT itself** | 30 days |
| Pre-change | Manual vzdump + logical dump before updates or migrations | as above | ad hoc |
| Encryption key | `ENCRYPTION_KEY` backed up off-box | see homelab inventory | must never change |

**Gaps:**

- **No offsite copy.** The daily dumps live on the same CT they protect, so
  they only guard against logical errors, not loss of the CT or host.
- **Cron not created at deploy.** `setup-db-lxc.sh` is meant to install the
  cron entry, but at the original deploy it didn't (cause unknown). The entry
  has existed only since 2026-09-25, when it was added by hand. Check with
  `crontab -l` on the DB CT.
- **Restores are untested.** No restore test has been recorded; see
  Verification.
- **Key is essential.** A dump without the encryption key cannot decrypt the
  encrypted columns (client names/ABNs, descriptions). Amounts and dates are
  stored in plaintext.

Setup details: `docs/DEPLOYMENT-PROXMOX-LXC.md` §7.

## UI-Based Backup Export

**Location:** Settings → About → "Database Backup". The page calls
`GET /backup/export`, which returns a complete SQL dump
(`easytax-au-backup-YYYY-MM-DD.sql`) and is rate limited to 3 exports per 5
minutes.

- **Bare-metal / LXC:** runs `pg_dump` directly using the `DB_*` settings.
- **Docker (`IS_DOCKER=true`):** runs `docker exec easytax-au-db pg_dump`. This
  is **broken** in the shipped Docker images, which have no Docker CLI or
  socket (I06 in `NEXT-TASKS.md`).
- **Security:** the endpoint is unauthenticated. Anyone who can reach the API
  can download the whole database (C02). Keep the app LAN-only until
  authentication lands.

## Restore

```bash
# LXC: restore a daily dump into an EMPTY database (take a fresh dump first)
gunzip -c /root/backups/easytax-db-YYYYMMDD-HHMMSS.sql.gz | su - postgres -c "psql easytax-au"

# UI export (plain SQL)
psql -U postgres easytax-au < easytax-au-backup-YYYY-MM-DD.sql
```

After a restore, start the API with the **same** `ENCRYPTION_KEY`. Pending
migrations apply on start (`migrationsRun: true`).

## Docker Compose deployment (untested path)

The Compose file keeps Postgres data in the named volume `easytax-au-pgdata`,
which `git clean` cannot delete; only `docker volume rm easytax-au-pgdata`
removes it.

```bash
# Backup
docker exec easytax-au-db pg_dump -U postgres easytax-au > backup-$(date +%Y%m%d-%H%M%S).sql
docker run --rm -v easytax-au-pgdata:/data -v "$(pwd)":/backup alpine tar czf /backup/pgdata-backup.tar.gz -C /data .

# Restore
docker exec -i easytax-au-db psql -U postgres easytax-au < backup.sql
docker volume create easytax-au-pgdata
docker run --rm -v easytax-au-pgdata:/data -v "$(pwd)":/backup alpine tar xzf /backup/pgdata-backup.tar.gz -C /data
```

## Verification

Test a restore at least quarterly and before any schema migration:

1. Restore the latest dump into a disposable database. `docs/core/TESTING.md`
   describes how to start one.
2. Start the API against it with the production key.
3. Confirm the record counts and that encrypted fields decrypt.

There is no automated restore script yet. Record each test in the homelab
inventory.
