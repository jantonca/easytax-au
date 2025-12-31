import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EncryptedColumnTransformer } from '../../../common/transformers';

/**
 * Client entity representing people/companies who pay you for freelance work.
 *
 * Sensitive fields (`name`, `abn`) are encrypted at rest using AES-256-GCM.
 * This entity is used for tracking income sources and PSI (Personal Services Income) rules.
 *
 * @example
 * ```typescript
 * const client = new Client();
 * client.name = 'Acme Corp';
 * client.abn = '51824753556';
 * client.isPsiEligible = false;
 * ```
 *
 * @security
 * - `name` field is AES-256-GCM encrypted
 * - `abn` field is AES-256-GCM encrypted
 * - Never log decrypted values containing PII
 */
@Entity('clients')
export class Client extends BaseEntity {
  /**
   * Client's legal name (encrypted at rest).
   * @example "Acme Corporation Pty Ltd"
   * @security Encrypted with AES-256-GCM
   */
  @Column({
    type: 'text',
    transformer: new EncryptedColumnTransformer(),
  })
  name!: string;

  /**
   * Australian Business Number (encrypted at rest).
   * Format: 11 digits (e.g., "51824753556")
   * @example "51824753556"
   * @security Encrypted with AES-256-GCM
   */
  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptedColumnTransformer(),
  })
  abn?: string | null;

  /**
   * Whether the client's payments are subject to Personal Services Income (PSI) rules.
   *
   * PSI rules apply when income is mainly a reward for your personal efforts or skills.
   * If true, certain deductions may be limited under ATO guidelines.
   *
   * @see https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/personal-services-income
   * @default false
   */
  @Column({ name: 'is_psi_eligible', type: 'boolean', default: false })
  isPsiEligible!: boolean;
}
