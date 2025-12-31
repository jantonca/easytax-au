# Roadmap: EasyTax-AU

## Scope Definition

**Purpose:** Personal Australian tax management for a single freelancer.  
**Not:** A commercial product, multi-tenant SaaS, or public service.

---

## Phase 1: MVP (Foundation)

**Goal:** Manual CRUD for expenses/incomes + basic BAS summary.

### Backend

| Task              | Description                                    | Priority |
| ----------------- | ---------------------------------------------- | -------- |
| NestJS scaffold   | Initialize project with TypeORM + PostgreSQL   | 🔴 High  |
| Categories module | CRUD + seed default categories                 | 🔴 High  |
| Providers module  | CRUD + seed common providers                   | 🔴 High  |
| Clients module    | CRUD for freelance clients                     | 🔴 High  |
| Expenses module   | Full CRUD with provider auto-fill              | 🔴 High  |
| Incomes module    | Full CRUD for invoices                         | 🔴 High  |
| BAS module        | Read-only quarterly summary (G1, 1A, 1B)       | 🔴 High  |
| Encryption        | AES-256-GCM transformer for sensitive columns  | 🔴 High  |
| decimal.js        | All currency math uses Decimal, store as cents | 🔴 High  |

### Infrastructure

| Task           | Description                    | Priority  |
| -------------- | ------------------------------ | --------- |
| Docker Compose | PostgreSQL 15 + API container  | 🔴 High   |
| .env.example   | Template with required secrets | 🔴 High   |
| Healthcheck    | `pg_isready` in docker-compose | 🟡 Medium |

### Validation

| Task           | Description                         | Priority |
| -------------- | ----------------------------------- | -------- |
| DTO validation | class-validator on all inputs       | 🔴 High  |
| GST auto-calc  | If international provider → GST = 0 | 🔴 High  |
| biz_percent    | Validate 0-100 range                | 🔴 High  |

### Deliverable

- API running on `localhost:3000`
- Can manually add expenses/incomes via REST
- Can query BAS summary for any quarter

---

## Phase 2: Quality of Life

**Goal:** Make daily use more convenient.

### Features

| Task                | Description                                  | Priority  |
| ------------------- | -------------------------------------------- | --------- |
| CSV Import          | Bulk import expenses from bank export        | 🟡 Medium |
| ImportJob entity    | Track imports, allow rollback                | 🟡 Medium |
| Duplicate detection | Warn if same date + amount + provider exists | 🟡 Medium |
| FY helper           | Auto-detect FY and quarter from date         | 🟡 Medium |
| Swagger docs        | Auto-generated API documentation             | 🟡 Medium |

### UI Options (Pick One)

| Option           | Effort | Notes                                |
| ---------------- | ------ | ------------------------------------ |
| AdminJS          | Low    | Auto-generated CRUD UI from entities |
| Simple React SPA | Medium | Custom but more work                 |
| CLI tool         | Low    | For terminal lovers                  |

---

## Phase 3: Automation

**Goal:** Reduce manual work.

### Features

| Task                  | Description                                 | Priority |
| --------------------- | ------------------------------------------- | -------- |
| Recurring expenses    | Auto-generate monthly entries (e.g., iinet) | 🟢 Low   |
| Bank statement parser | Map CSV columns to expense fields           | 🟢 Low   |
| Provider auto-match   | Fuzzy match "GITHUB.COM" → GitHub provider  | 🟢 Low   |
| Email import          | Forward receipts, extract with OCR          | 🟢 Low   |

---

## Phase 4: Reporting

**Goal:** Better visibility into finances.

### Features

| Task       | Description                                           | Priority |
| ---------- | ----------------------------------------------------- | -------- |
| Dashboard  | Summary charts (expenses by category, monthly trends) | 🟢 Low   |
| PDF export | Generate BAS-ready report                             | 🟢 Low   |
| FY summary | Annual totals for tax return                          | 🟢 Low   |

---

## Out of Scope (Won't Build)

| Feature                 | Reason                          |
| ----------------------- | ------------------------------- |
| Multi-user / Auth       | Single user, local-only         |
| Bank API integration    | Privacy concern, manual is fine |
| ATO direct submission   | Use their portal                |
| Mobile app              | Desktop/web is sufficient       |
| Asset depreciation      | Can add later if needed         |
| Superannuation tracking | Separate concern                |

---

## Definition of Done (MVP)

- [ ] Can create/read/update/delete Categories
- [ ] Can create/read/update/delete Providers (with seed data)
- [ ] Can create/read/update/delete Clients
- [ ] Can create/read/update/delete Expenses
- [ ] Can create/read/update/delete Incomes
- [ ] Selecting international provider auto-sets GST = 0
- [ ] biz_percent correctly reduces claimable GST
- [ ] BAS endpoint returns G1, 1A, 1B for given quarter
- [ ] Sensitive fields encrypted at rest
- [ ] All currency calculations use decimal.js
- [ ] Docker Compose starts cleanly
- [ ] README has install instructions

---

## Timeline Estimate

| Phase             | Effort       | Calendar Time |
| ----------------- | ------------ | ------------- |
| Phase 1 (MVP)     | ~20-30 hours | 1-2 weeks     |
| Phase 2 (QoL)     | ~15-20 hours | 1 week        |
| Phase 3 (Auto)    | ~20+ hours   | As needed     |
| Phase 4 (Reports) | ~10-15 hours | As needed     |

**Recommendation:** Complete Phase 1 before Q3 FY2025 (Jan-Mar 2025) to use it for your next BAS.
