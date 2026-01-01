import { Global, Module, OnModuleInit, Logger } from '@nestjs/common';
import { MoneyService } from './services/money.service';
import { FYService } from './services/fy.service';

/**
 * Common module providing shared services across the application.
 *
 * This module is marked as @Global so services like MoneyService and FYService
 * are available throughout the app without explicit imports.
 *
 * Validates critical environment variables at startup to fail fast.
 *
 * @exports MoneyService - GST and currency calculations
 * @exports FYService - Australian Financial Year and quarter utilities
 */
@Global()
@Module({
  providers: [MoneyService, FYService],
  exports: [MoneyService, FYService],
})
export class CommonModule implements OnModuleInit {
  private readonly logger = new Logger(CommonModule.name);

  /**
   * Validates critical environment variables at application startup.
   * Fails fast if ENCRYPTION_KEY is missing or invalid.
   *
   * @throws Error if ENCRYPTION_KEY is not set or not 64 hex characters
   */
  onModuleInit(): void {
    this.validateEncryptionKey();
  }

  /**
   * Validates the ENCRYPTION_KEY environment variable.
   * Must be exactly 64 hexadecimal characters (32 bytes for AES-256).
   */
  private validateEncryptionKey(): void {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is not set. ' +
          'Generate one with: openssl rand -hex 32',
      );
    }

    if (!/^[a-fA-F0-9]{64}$/.test(key)) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes). ` +
          `Current length: ${key.length}. Generate one with: openssl rand -hex 32`,
      );
    }

    this.logger.log('ENCRYPTION_KEY validated successfully');
  }
}
