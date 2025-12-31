import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './entities/income.entity';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { Client } from '../clients/entities/client.entity';
import { CommonModule } from '../../common/common.module';

/**
 * Module for managing Income entities.
 *
 * Incomes represent revenue from freelance work with:
 * - Automatic total calculation (subtotal + GST)
 * - Encrypted description field
 * - Payment status tracking
 *
 * @provides IncomesService
 * @exports IncomesService, TypeOrmModule (for Income entity)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Income, Client]), CommonModule],
  controllers: [IncomesController],
  providers: [IncomesService],
  exports: [IncomesService, TypeOrmModule],
})
export class IncomesModule {}
