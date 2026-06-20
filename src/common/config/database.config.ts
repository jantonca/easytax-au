import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dataSourceOptions } from '../../data-source';

/**
 * Database configuration for the NestJS TypeOrmModule.
 *
 * Builds on the shared {@link dataSourceOptions} (connection + entities +
 * migrations) and adds runtime-only concerns. Schema is managed by migrations,
 * never `synchronize`; `migrationsRun` applies any pending migrations on
 * startup (safe for this single-instance deployment).
 */
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    ...dataSourceOptions,
    migrationsRun: true,
    logging: process.env.NODE_ENV === 'development',
  }),
);
