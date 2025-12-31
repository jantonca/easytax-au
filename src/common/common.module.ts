import { Global, Module } from '@nestjs/common';
import { MoneyService } from './services/money.service';
import { FYService } from './services/fy.service';

/**
 * Common module providing shared services across the application.
 *
 * This module is marked as @Global so services like MoneyService and FYService
 * are available throughout the app without explicit imports.
 *
 * @exports MoneyService - GST and currency calculations
 * @exports FYService - Australian Financial Year and quarter utilities
 */
@Global()
@Module({
  providers: [MoneyService, FYService],
  exports: [MoneyService, FYService],
})
export class CommonModule {}
