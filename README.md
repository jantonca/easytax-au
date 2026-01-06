# EasyTax-AU 🇦🇺

A modular financial engine for Australian freelancers. Automates Simpler BAS, GST reconciliation, and deduction tracking.

## Technical Goals

- **Self-Hosted:** Optimized for Proxmox LXC / Docker.
- **Privacy First:** Local-only data processing with database-level encryption.
- **Dev-Centric:** Metadata-driven provider system (Google, ChatGPT, VentraIP).
- **Frontend SPA:** React 19 + Vite 7 + Tailwind CSS 4 with shadcn-style components, using a fetch-based API client and TanStack Query for data fetching.
- **CSV Import:** Bulk import expenses/incomes with preview, validation, and duplicate detection.

---

## Quick Start

### Prerequisites

- [fnm](https://github.com/Schniz/fnm) (Fast Node Manager)
- [pnpm](https://pnpm.io/) 9.x
- [Docker](https://www.docker.com/) & Docker Compose

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/easytax-au.git
cd easytax-au

# 2. Set up Node.js (via fnm)
fnm install 20
fnm use 20

# 3. Install dependencies
pnpm install

# 4. Copy environment variables
cp .env.example .env

# 5. Start the database
docker compose up -d easytax-au-db

# 6. Run the application
pnpm run start:dev
```

### Frontend (web SPA)

The React SPA lives in `web/` and talks to the NestJS API.

```bash path=null start=null
# Dev server
pnpm --filter web dev    # http://localhost:5173

# Lint
pnpm --filter web lint

# Tests
pnpm --filter web test

# Build
pnpm --filter web build
```

### Available Scripts

|| Command | Description |
|| -------------------------- | ------------------------------------------------ |
|| `pnpm run start:dev` | Start API in development mode (watch) |
|| `pnpm run build` | Build API for production |
|| `pnpm run start:prod` | Start production API build |
|| `pnpm run test` | Run backend unit tests |
|| `pnpm run test:cov` | Run backend tests with coverage report |
|| `pnpm run test:e2e` | Run backend end-to-end tests |
|| `pnpm run lint` | Run backend ESLint |
|| `pnpm run format` | Run Prettier on backend source |
|| `pnpm run generate:types` | Generate shared API types to `shared/types/api.d.ts` |

### Docker Deployment (Full Stack)

For production deployment, all services (database, API, and frontend) run in containers.

#### Standard Deployment (HTTP)

```bash
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env and set: DB_PASSWORD, ENCRYPTION_KEY

# 2. Build and start all services (database, API, frontend)
docker compose up -d --build

# 3. View logs
docker compose logs -f easytax-au-web    # Frontend logs
docker compose logs -f easytax-au-api    # API logs

# 4. Stop all services
docker compose down
```

**Endpoints:**
- **Frontend:** `http://localhost` (port 80)
- **API:** `http://localhost:3000`
- **Swagger Docs:** `http://localhost:3000/api/docs`

#### Traefik Deployment (HTTPS)

For production with HTTPS via Traefik reverse proxy:

```bash
# 1. Configure .env for Traefik
cp .env.example .env
# Edit .env and set:
TRAEFIK_ENABLED=true
TRAEFIK_HOST=easytax.bobeliadesign.com
DB_PASSWORD=your_secure_password
ENCRYPTION_KEY=$(openssl rand -hex 32)

# 2. Start services
docker compose up -d --build

# 3. Configure Traefik (if not already set up)
# Ensure Traefik is on the same Docker network: easytax-au-network
# Or add Traefik labels to connect to your existing Traefik network
```

**Traefik Configuration Notes:**
- Frontend container has pre-configured Traefik labels
- HTTPS redirect is automatic when `TRAEFIK_ENABLED=true`
- Domain: `easytax.bobeliadesign.com`
- TLS certificates managed by Traefik (Let's Encrypt recommended)
- Access via: `https://easytax.bobeliadesign.com`

#### Environment Variables

| Variable           | Required | Default       | Description                                    |
| ------------------ | -------- | ------------- | ---------------------------------------------- |
| `DB_PASSWORD`      | ✅       | -             | PostgreSQL password                            |
| `ENCRYPTION_KEY`   | ✅       | -             | 64-char hex key (generate: `openssl rand -hex 32`) |
| `DB_HOST`          | ❌       | localhost     | Database host (auto-set in Docker)             |
| `DB_PORT`          | ❌       | 5432          | PostgreSQL port                                |
| `DB_NAME`          | ❌       | easytax-au    | Database name                                  |
| `DB_USERNAME`      | ❌       | postgres      | Database user                                  |
| `PORT`             | ❌       | 3000          | API server port                                |
| `WEB_PORT`         | ❌       | 80            | Frontend port                                  |
| `NODE_ENV`         | ❌       | development   | Environment mode                               |
| `TRAEFIK_ENABLED`  | ❌       | false         | Enable Traefik integration                     |
| `TRAEFIK_HOST`     | ❌       | easytax.bobeliadesign.com | Domain for Traefik routing          |

#### Production Checklist

- [ ] Set strong `DB_PASSWORD` (use password manager)
- [ ] Generate unique `ENCRYPTION_KEY` (use `openssl rand -hex 32`)
- [ ] Configure automatic backups for `./pgdata` directory
- [ ] Set up Traefik with Let's Encrypt for HTTPS
- [ ] Review firewall rules (only expose port 80/443 via Traefik)
- [ ] Test backup restoration process

---

## Documentation

| Document                           | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tech stack, module design, ATO logic |
| [SCHEMA.md](SCHEMA.md)             | Database entities & relationships    |
| [ROADMAP.md](ROADMAP.md)           | MVP scope & development phases       |
| [TASKS.md](TASKS.md)               | Development checklist                |
| [SECURITY.md](SECURITY.md)         | Encryption & data sovereignty        |
| [BACKUP.md](BACKUP.md)             | 3-2-1 backup strategy                |
| [AGENTS.md](AGENTS.md)             | AI coding guidelines                 |
