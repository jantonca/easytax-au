# 3-2-1 Backup Plan

1. **Local (Hot):** Hourly ZFS snapshots on the Proxmox host.
2. **Local (Cold):** Nightly encrypted `pg_dump` saved to `/backups`.
3. **Offsite:** Use **Restic** to sync the `/backups` and `/data` folders to **Backblaze B2** (Encrypted).

## Database Storage

**Docker Named Volume:** The Postgres database uses a Docker named volume (`easytax-au-pgdata`) for persistent storage. This approach:
- ✅ **Protects against accidental deletion** (immune to `git clean -xfd`)
- ✅ **Better performance** on non-Linux hosts
- ✅ **Explicit lifecycle** - requires `docker volume rm easytax-au-pgdata` to delete

### Managing Database Volumes

**Backup database:**
```bash
# Method 1: pg_dump (recommended)
docker exec easytax-au-db pg_dump -U postgres easytax-au > backup-$(date +%Y%m%d-%H%M%S).sql

# Method 2: Full volume backup
docker run --rm -v easytax-au-pgdata:/data -v $(pwd):/backup alpine tar czf /backup/pgdata-backup.tar.gz -C /data .
```

**Restore database:**
```bash
# Method 1: From pg_dump
docker exec -i easytax-au-db psql -U postgres easytax-au < backup.sql

# Method 2: From volume backup
docker volume create easytax-au-pgdata
docker run --rm -v easytax-au-pgdata:/data -v $(pwd):/backup alpine tar xzf /backup/pgdata-backup.tar.gz -C /data
```

**List and inspect volumes:**
```bash
docker volume ls
docker volume inspect easytax-au-pgdata
```

## Verification

Test restore every quarter by spinning up a dummy LXC and running `scripts/restore.sh`.
