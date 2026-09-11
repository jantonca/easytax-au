import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for income data (the OpenAPI shape of the Income entity).
 *
 * The Income entity itself carries no Swagger decorators, which previously
 * produced an empty `Income: Record<string, never>` response schema in the
 * generated shared types. This DTO describes the actual serialized shape —
 * including the M02 `paymentDate` response contract.
 */
export class IncomeClientDto {
  @ApiProperty({ description: 'Client UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Client name (decrypted)', example: 'Acme Corp' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Client ABN (decrypted)',
    example: '51824753556',
    type: String,
    nullable: true,
  })
  abn?: string | null;

  @ApiProperty({ description: 'Whether income from this client counts as PSI', example: false })
  isPsiEligible!: boolean;

  @ApiProperty({ description: 'Creation timestamp', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp', type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class IncomeResponseDto {
  @ApiProperty({ description: 'Income UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({
    description:
      'Invoice date (date-only, YYYY-MM-DD — PostgreSQL date columns hydrate as plain date strings)',
    example: '2026-06-30',
    type: String,
    format: 'date',
  })
  date!: Date;

  @ApiPropertyOptional({
    description: 'Your invoice number',
    example: 'INV-2026-001',
    type: String,
    nullable: true,
  })
  invoiceNum?: string | null;

  @ApiPropertyOptional({
    description: 'Work description (decrypted)',
    example: 'Website development',
    type: String,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({ description: 'Subtotal in cents (ex GST)', example: 100000 })
  subtotalCents!: number;

  @ApiProperty({ description: 'GST collected in cents', example: 10000 })
  gstCents!: number;

  @ApiProperty({ description: 'Total in cents (subtotal + GST)', example: 110000 })
  totalCents!: number;

  @ApiProperty({ description: 'Whether payment has been received', example: true })
  isPaid!: boolean;

  @ApiPropertyOptional({
    description:
      'Date the payment was received (date-only, YYYY-MM-DD); null while unpaid and for paid records whose receipt date is not yet reconciled',
    example: '2026-07-02',
    type: String,
    format: 'date',
    nullable: true,
  })
  paymentDate?: Date | null;

  @ApiProperty({ description: 'Client UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  clientId!: string;

  @ApiProperty({ description: 'Creation timestamp', type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp', type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ description: 'The paying client', type: IncomeClientDto })
  client!: IncomeClientDto;
}
