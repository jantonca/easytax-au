import { Global, Module } from '@nestjs/common';
import { MoneyService } from './services/money.service';

/**
 * Common module providing shared services across the application.
 *
 * This module is marked as @Global so services like MoneyService
 * are available throughout the app without explicit imports.
 *
 * @exports MoneyService - GST and currency calculations
 */
@Global()
@Module({
  providers: [MoneyService],
  exports: [MoneyService],
})
export class CommonModule {}
