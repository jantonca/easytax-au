import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common';
import databaseConfig from './common/config/database.config';
import { BasModule } from './modules/bas';
import { CategoriesModule } from './modules/categories';
import { ClientsModule } from './modules/clients';
import { CsvImportModule } from './modules/csv-import';
import { ExpensesModule } from './modules/expenses';
import { ImportJobsModule } from './modules/import-jobs';
import { IncomesModule } from './modules/incomes';
import { ProvidersModule } from './modules/providers';
import { RecurringExpensesModule } from './modules/recurring-expenses';
import { ReportsModule } from './modules/reports';
import { BackupModule } from './modules/backup';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute default
        limit: 100, // 100 requests per minute default
      },
    ]),
    // Configure TypeORM with async factory
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = configService.get<TypeOrmModuleOptions>('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),
    // Common utilities (MoneyService, etc.)
    CommonModule,
    // Feature modules
    BasModule,
    CategoriesModule,
    ClientsModule,
    CsvImportModule,
    ExpensesModule,
    ImportJobsModule,
    IncomesModule,
    ProvidersModule,
    RecurringExpensesModule,
    ReportsModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
