import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesSeeder } from './categories.seeder';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

/**
 * Module for managing expense categories.
 *
 * Categories map expenses to ATO BAS labels for tax reporting.
 * Default categories are seeded on application startup.
 *
 * @provides CategoriesService
 * @exports CategoriesService, TypeOrmModule (for Category entity)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesSeeder],
  exports: [CategoriesService, TypeOrmModule],
})
export class CategoriesModule {}
