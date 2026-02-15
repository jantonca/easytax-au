import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ValueTransformer } from 'typeorm';
import { Logger } from '@nestjs/common';

/**
 * AES-256-GCM encryption transformer for TypeORM columns.
 *
 * This transformer automatically encrypts data when saving to the database
 * and decrypts it when reading. Each encryption uses a unique IV (Initialization Vector)
 * ensuring identical plaintext values produce different ciphertext.
 *
 * @example
 * ```typescript
 * @Column({
 *   type: 'text',
 *   transformer: new EncryptedColumnTransformer(),
 * })
 * clientName: string;
 * ```
 *
 * @security
 * - Uses AES-256-GCM (authenticated encryption)
 * - Generates unique 12-byte IV per encryption
 * - Includes 16-byte authentication tag
 * - Requires 32-byte (64 hex chars) ENCRYPTION_KEY in environment
 *
 * @storage Format: `iv:authTag:ciphertext` (all hex-encoded)
 */
export class EncryptedColumnTransformer implements ValueTransformer {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12; // GCM recommended IV length
  private readonly authTagLength = 16;
  private readonly logger = new Logger(EncryptedColumnTransformer.name);

  /**
   * Gets the encryption key from environment variables.
   * @throws Error if ENCRYPTION_KEY is not set or invalid length
   */
  private getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    if (key.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypts a value before storing in the database.
   * @param value - The plaintext string to encrypt
   * @returns Encrypted string in format `iv:authTag:ciphertext` or null
   */
  to(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const key = this.getKey();
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, key, iv, {
      authTagLength: this.authTagLength,
    });

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all hex-encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts a value when reading from the database.
   * @param value - The encrypted string in format `iv:authTag:ciphertext`
   * @returns Decrypted plaintext string or null
   * @throws Error if decryption fails (tampered data or wrong key)
   */
  from(value: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parts = value.split(':');
    if (parts.length !== 3) {
      // Value is not encrypted (legacy data or plain text)
      // Log warning for security audit trail
      this.logger.warn(
        `Encountered unencrypted data (expected format: iv:authTag:ciphertext). ` +
          `This may indicate legacy plaintext data or data corruption. ` +
          `Value length: ${value.length} chars. ` +
          `Consider migrating to encrypted format.`,
      );
      return value;
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    const key = this.getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(this.algorithm, key, iv, {
      authTagLength: this.authTagLength,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
