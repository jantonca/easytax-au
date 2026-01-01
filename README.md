# EasyTax-AU 🇦🇺

A modular financial engine for Australian freelancers. Automates Simpler BAS, GST reconciliation, and deduction tracking.

## Technical Goals

- **Self-Hosted:** Optimized for Proxmox LXC / Docker.
- **Privacy First:** Local-only data processing with database-level encryption.
- **Dev-Centric:** Metadata-driven provider system (Google, ChatGPT, VentraIP).

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

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `pnpm run start:dev`  | Start in development mode (watch) |
| `pnpm run build`      | Build for production              |
| `pnpm run start:prod` | Start production build            |
| `pnpm run test`       | Run unit tests                    |
| `pnpm run test:cov`   | Run tests with coverage report    |
| `pnpm run test:e2e`   | Run end-to-end tests              |
| `pnpm run lint`       | Run ESLint                        |
| `pnpm run format`     | Run Prettier                      |

### Docker Deployment (Full Stack)

For production deployment, both API and database run in containers:

```bash
# Set required environment variables
export DB_PASSWORD=your_secure_password
export ENCRYPTION_KEY=your_32_char_hex_key

# Start full stack (DB + API)
docker compose up -d

# View logs
docker compose logs -f easytax-au-api

# Stop all services
docker compose down
```

**Endpoints:**

- API: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api/docs`

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
