import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { CsvImportController } from './csv-import.controller';
import { CsvImportService } from './csv-import.service';
import { CsvParserService } from './csv-parser.service';
import { ProviderMatcherService } from './provider-matcher.service';
import { ClientMatcherService } from './client-matcher.service';
import { IncomeCsvImportService } from './income-csv-import.service';
import { Provider } from '../providers/entities/provider.entity';
import { Category } from '../categories/entities/category.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../incomes/entities/income.entity';
import { Client } from '../clients/entities/client.entity';
import { ImportJob } from '../import-jobs/entities/import-job.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Provider, Category, Expense, Income, Client, ImportJob]),
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    CommonModule,
  ],
  controllers: [CsvImportController],
  providers: [
    CsvImportService,
    CsvParserService,
    ProviderMatcherService,
    ClientMatcherService,
    IncomeCsvImportService,
  ],
  exports: [
    CsvImportService,
    CsvParserService,
    ProviderMatcherService,
    ClientMatcherService,
    IncomeCsvImportService,
  ],
})
export class CsvImportModule {}
