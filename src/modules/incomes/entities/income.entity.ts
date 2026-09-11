import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EncryptedColumnTransformer } from '../../../common/transformers';
import { Client } from '../../clients/entities/client.entity';

/**
 * Income entity representing revenue from freelance work.
 *
 * All monetary values are stored as integers in cents to avoid floating-point errors.
 * The `description` field is encrypted at rest using AES-256-GCM.
 * The `totalCents` is auto-calculated as `subtotalCents + gstCents`.
 *
 * @example
 * ```typescript
 * const income = new Income();
 * income.date = new Date('2024-01-15');
 * income.subtotalCents = 100000; // $1,000.00
 * income.gstCents = 10000;       // $100.00 GST
 * income.totalCents = 110000;    // $1,100.00 total
 * income.isPaid = false;
 * income.client = acmeCorpClient;
 * ```
 *
 * @security
 * - `description` field is AES-256-GCM encrypted
 */
@Entity('incomes')
@Index('idx_incomes_date', ['date'])
@Index('idx_incomes_client', ['clientId'])
@Index('idx_incomes_is_paid', ['isPaid'])
@Index('idx_incomes_payment_date', ['paymentDate'])
export class Income extends BaseEntity {
  /**
   * Invoice date.
   * @example "2024-01-15"
   */
  @Column({ type: 'date' })
  date!: Date;

  /**
   * Your invoice number (optional).
   * @example "INV-2024-001"
   */
  @Column({ name: 'invoice_num', type: 'varchar', length: 50, nullable: true })
  invoiceNum?: string | null;

  /**
   * Description of the work performed (encrypted at rest).
   * @example "Website development - Phase 1"
   * @security Encrypted with AES-256-GCM
   */
  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptedColumnTransformer(),
  })
  description?: string | null;

  /**
   * Subtotal amount in cents (before GST).
   * @example 100000 (represents $1,000.00)
   */
  @Column({ name: 'subtotal_cents', type: 'integer' })
  subtotalCents!: number;

  /**
   * GST collected in cents.
   * @example 10000 (represents $100.00)
   */
  @Column({ name: 'gst_cents', type: 'integer' })
  gstCents!: number;

  /**
   * Total amount in cents (subtotal + GST).
   * Auto-calculated by the service layer.
   * @example 110000 (represents $1,100.00)
   */
  @Column({ name: 'total_cents', type: 'integer' })
  totalCents!: number;

  /**
   * Whether payment has been received.
   * @default false
   */
  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid!: boolean;

  /**
   * Date the payment was received (date-only, Australian cash-basis BAS
   * attribution). Always NULL while the invoice is unpaid.
   *
   * `isPaid = true` with `paymentDate = null` means "paid, receipt date not
   * yet recorded" — a legacy/unknown state that must never be inferred from
   * the invoice date, timestamps, or the current date. See
   * docs/core/CASH-BASIS-DESIGN.md.
   */
  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate?: Date | null;

  /**
   * The client who paid for this work.
   */
  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  /**
   * Foreign key for client relationship.
   */
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;
}
