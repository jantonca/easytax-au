# Security & Maintenance

## Public Repo Rules

- **Rule 1:** No ABNs, Bank Details, or Client Names in code.
- **Rule 2:** All sensitive columns in PostgreSQL (e.g., `client_name`, `amount`) are encrypted using `AES-256-GCM` via TypeORM transformers.
- **Rule 3:** The `/data` folder is blocked by `.gitignore`.

## Remote Access

- Access the UI via **Cloudflare Tunnels** or **Tailscale** to avoid exposing home IP ports.
