import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Base entity class providing common fields for all entities.
 *
 * All entities should extend this class to get:
 * - Auto-generated UUID primary key
 * - Automatic `created_at` timestamp
 * - Automatic `updated_at` timestamp
 *
 * @example
 * ```typescript
 * @Entity('categories')
 * export class Category extends BaseEntity {
 *   @Column()
 *   name: string;
 * }
 * ```
 */
export abstract class BaseEntity {
  /**
   * Unique identifier (UUID v4)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Timestamp when the record was created.
   * Automatically set by TypeORM on insert.
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  /**
   * Timestamp when the record was last updated.
   * Automatically updated by TypeORM on every save.
   */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
