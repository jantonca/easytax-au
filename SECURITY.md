# Security & Maintenance

## Public Repo Rules

- **Rule 1:** No ABNs, Bank Details, or Client Names in code.
- **Rule 2:** All sensitive columns in PostgreSQL (e.g., `client_name`, `amount`) are encrypted using `AES-256-GCM` via TypeORM transformers.
- **Rule 3:** The `/data` folder is blocked by `.gitignore`.

## Encryption Implementation

### Algorithm: AES-256-GCM

- **Cipher:** AES-256-GCM (Authenticated Encryption with Associated Data)
- **Key Size:** 256-bit (32 bytes, stored as 64 hex characters)
- **IV:** 12 bytes (unique per encryption, stored with ciphertext)
- **Auth Tag:** 16 bytes (ensures data integrity)

### Storage Format

Encrypted values are stored as: `{iv}:{authTag}:{ciphertext}` (all hex-encoded)

Example: `a1b2c3d4e5f6a1b2c3d4e5f6:0123456789abcdef0123456789abcdef:encrypted_data_here`

### Key Management

```bash
# Generate a secure 32-byte encryption key
openssl rand -hex 32
```

Store the key in `.env` as `ENCRYPTION_KEY` (never commit this file).

### Encrypted Fields

| Entity   | Field         | Purpose              |
| -------- | ------------- | -------------------- |
| Client   | `name`        | Client's legal name  |
| Client   | `abn`         | Australian Bus. No.  |
| Expense  | `description` | Transaction details  |
| Income   | `description` | Invoice descriptions |

### Usage in Entities

```typescript
import { EncryptedColumnTransformer } from '@/common/transformers';

@Column({
  type: 'text',
  transformer: new EncryptedColumnTransformer(),
})
clientName: string;
```

### Security Properties

1. **Confidentiality:** Data unreadable without the key
2. **Integrity:** Auth tag detects tampering
3. **Uniqueness:** Random IV ensures identical values encrypt differently
4. **Forward Secrecy:** Each field encryption is independent

## Remote Access

- Access the UI via **Cloudflare Tunnels** or **Tailscale** to avoid exposing home IP ports.
