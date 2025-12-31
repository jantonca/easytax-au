# 3-2-1 Backup Plan

1. **Local (Hot):** Hourly ZFS snapshots on the Proxmox host.
2. **Local (Cold):** Nightly encrypted `pg_dump` saved to `/backups`.
3. **Offsite:** Use **Restic** to sync the `/backups` and `/data` folders to **Backblaze B2** (Encrypted).

## Verification

Test restore every quarter by spinning up a dummy LXC and running `scripts/restore.sh`.
