import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AustralianQuarter } from '../../../common/services/fy.service';

/**
 * Response DTO for expense data with computed FY/Quarter fields.
 *
 * This DTO includes all expense fields plus computed financial year
 * and quarter information based on the expense date.
 *
 * @example
 * ```json
 * {
 *   "id": "uuid-here",
 *   "date": "2025-08-15",
 *   "amountCents": 11000,
 *   "gstCents": 1000,
 *   "bizPercent": 100,
 *   "financialYear": 2026,
 *   "quarter": "Q1",
 *   "fyLabel": "FY2026",
 *   "quarterLabel": "Q1 FY2026",
 *   "provider": { "id": "...", "name": "GitHub" },
 *   "category": { "id": "...", "name": "Software" }
 * }
 * ```
 */
export class ExpenseResponseDto {
  /**
   * Unique identifier (UUID v4).
   */
  @ApiProperty({
    description: 'Expense UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  /**
   * Transaction date.
   */
  @ApiProperty({
    description: 'Transaction date',
    example: '2025-08-15',
  })
  date!: Date;

  /**
   * Description of what was purchased (decrypted).
   */
  @ApiPropertyOptional({
    description: 'Description (decrypted)',
    example: 'GitHub Copilot subscription',
  })
  description?: string | null;

  /**
   * Total amount in cents (including GST).
   */
  @ApiProperty({
    description: 'Amount in cents (inc GST)',
    example: 11000,
  })
  amountCents!: number;

  /**
   * GST component in cents.
   */
  @ApiProperty({
    description: 'GST in cents',
    example: 1000,
  })
  gstCents!: number;

  /**
   * Business use percentage (0-100).
   */
  @ApiProperty({
    description: 'Business use percentage',
    example: 100,
  })
  bizPercent!: number;

  /**
   * Currency code (ISO 4217).
   */
  @ApiProperty({
    description: 'Currency code',
    example: 'AUD',
  })
  currency!: string;

  /**
   * Optional reference to receipt file.
   */
  @ApiPropertyOptional({
    description: 'Receipt file reference',
    example: 'receipt-github-2024-01.pdf',
  })
  fileRef?: string | null;

  /**
   * Provider UUID.
   */
  @ApiProperty({
    description: 'Provider UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  providerId!: string;

  /**
   * Category UUID.
   */
  @ApiProperty({
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId!: string;

  /**
   * Import job UUID (null if manually created).
   */
  @ApiPropertyOptional({
    description: 'Import job UUID (null if manually created)',
    example: null,
  })
  importJobId?: string | null;

  // ============================================
  // Computed FY/Quarter Fields
  // ============================================

  /**
   * Australian Financial Year number.
   * The FY number is the calendar year in which the FY ends.
   * @example 2026 (for dates between Jul 2025 - Jun 2026)
   */
  @ApiProperty({
    description: 'Financial Year (year in which FY ends)',
    example: 2026,
  })
  financialYear!: number;

  /**
   * Quarter within the Australian Financial Year.
   * Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
   */
  @ApiProperty({
    description: 'Quarter (Q1=Jul-Sep, Q2=Oct-Dec, Q3=Jan-Mar, Q4=Apr-Jun)',
    example: 'Q1',
    enum: ['Q1', 'Q2', 'Q3', 'Q4'],
  })
  quarter!: AustralianQuarter;

  /**
   * Human-readable FY label.
   * @example "FY2026"
   */
  @ApiProperty({
    description: 'Human-readable FY label',
    example: 'FY2026',
  })
  fyLabel!: string;

  /**
   * Human-readable quarter label.
   * @example "Q1 FY2026"
   */
  @ApiProperty({
    description: 'Human-readable quarter label',
    example: 'Q1 FY2026',
  })
  quarterLabel!: string;

  // ============================================
  // Timestamps
  // ============================================

  /**
   * Record creation timestamp.
   */
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-08-15T10:30:00Z',
  })
  createdAt!: Date;

  /**
   * Record last update timestamp.
   */
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-08-15T10:30:00Z',
  })
  updatedAt!: Date;

  // ============================================
  // Relations (optional - loaded when requested)
  // ============================================

  /**
   * Provider relation (loaded).
   */
  @ApiPropertyOptional({
    description: 'Provider details',
  })
  provider?: {
    id: string;
    name: string;
    isInternational: boolean;
  };

  /**
   * Category relation (loaded).
   */
  @ApiPropertyOptional({
    description: 'Category details',
  })
  category?: {
    id: string;
    name: string;
    basLabel: string;
  };
}
