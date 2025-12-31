import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Provider } from './entities/provider.entity';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { ProvidersSeeder } from './providers.seeder';
import { Category } from '../categories/entities/category.entity';

/**
 * Module for Provider entity management.
 * Provides CRUD operations for vendors/providers you pay for business expenses.
 *
 * Features:
 * - Provider entity with international flag for GST treatment
 * - Links to default Category for auto-categorization
 * - Seeds default providers on first run
 */
@Module({
  imports: [TypeOrmModule.forFeature([Provider, Category])],
  controllers: [ProvidersController],
  providers: [ProvidersService, ProvidersSeeder],
  exports: [ProvidersService],
})
export class ProvidersModule {}
