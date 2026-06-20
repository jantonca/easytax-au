import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Shared TypeORM connection options.
 *
 * Single source of truth for the database connection, consumed by:
 * - the NestJS `TypeOrmModule` (see `common/config/database.config.ts`), and
 * - the TypeORM CLI for generating and running migrations.
 *
 * Reads `DB_*` environment variables with the same development defaults as the
 * rest of the app. `synchronize` is always `false` — schema changes are applied
 * exclusively through versioned migrations.
 *
 * Globs resolve relative to this file: `src/**` under ts-node (dev/CLI) and
 * `dist/src/**` once compiled (production).
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'easytax-au',
  entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
