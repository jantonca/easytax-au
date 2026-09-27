# Docker-phase review

Reviewed 2026-09-11 against the current Dockerfiles, nginx configuration,
remediation report and owner-provided execution summary.

**Assessment: configuration changes are consistent with the reported fixes.
Docker execution is owner-reported, not independently reproduced in this
review. Remote CI is still pending.** No new blocking application defect was
identified in this focused Docker review.

## Configuration assessment

- Web healthcheck now targets 127.0.0.1, matching nginx's IPv4 listener and
  avoiding the reported localhost/IPv6 mismatch.
- Removing USER nginx means the container starts its master process as root;
  nginx.conf retains `user nginx;` for worker privilege reduction. This is an
  explicit change from a wholly unprivileged container process configuration,
  not preservation of that earlier property. The comments describe the observed
  port-binding failure; they should not be taken as a universal statement that
  all container environments require root to bind port 80.
- The API image still declares USER nestjs. Both builders retain the reviewed
  workspace manifest and dependency-copy corrections.
- The web upstream names `easytax-au-api:3000`. The test network runbook creates
  an API container with that name, so Docker DNS and the nginx upstream agree.
- Cleanup now removes the temporary API/web containers, disconnects the retained
  database from the temporary network, removes that network and removes the
  temporary image tags. No database volume removal is included.

## Evidence limits

The supplied summary reports successful API/web image builds, API database
connectivity and healthcheck, web SPA/proxy/healthcheck operation, and cleanup.
It also reports fresh local gate results matching the preceding verified
application state: backend 716 tests, frontend 587 plus two skipped, both builds
and lint passing. Saved `dph-u.out`, `dph-w.out`, `dph-wb.out`, `dph-b.out`,
`dph-l.out` and `dph-wl.out` corroborate the post-Docker local gate output.
This review did not rerun those unchanged application gates or independently
reconstruct their process exit codes.

The runtime containers and image tags were removed, so this review cannot
inspect their actual user IDs, dependency contents, sizes or health histories.
No separate Docker build/runtime logs were located in the inspected
`/tmp/opencode` artifacts. These claims remain attributed to the owner-provided
execution evidence and executor's report, rather than a fresh independent run.
Image size alone does not verify that development dependencies were excluded.

## Before preparing commits

- Three newly observed untracked files at the repository root—`The`, `applying`
  and `operations,`—are each zero bytes. They appear accidental and should not
  enter a commit. They were left untouched; confirm and remove as appropriate.
- The remediation report's current top-level Docker completion statements
  conflict with older unlabelled passages: the “not run” list still says Docker
  access was not granted, R03 still says image building needs access, and §9
  still requests Docker access. Update or clearly label those statements as
  historical. The M04 row likewise retains a superseded DB-blocked qualifier.
- Review the final file selection explicitly before staging; the working tree
  includes user STATUS.md, implementation, generated contracts, several review
  reports and the accidental empty files. No Git mutation was performed here.

The next execution gate is remote CI under the existing Git/remote-operation
approval rules. Successful local Docker checks do not establish that the
workflow runs successfully from the eventual committed tree.

Only this review report was added. No Docker command, service operation,
database mutation, install, Git mutation or implementation edit was performed.
