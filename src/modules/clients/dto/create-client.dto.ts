import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * DTO for creating a new client.
 *
 * Clients represent people or companies who pay you for freelance work.
 * Sensitive fields (name, abn) will be encrypted at rest.
 *
 * @example
 * ```json
 * {
 *   "name": "Acme Corporation Pty Ltd",
 *   "abn": "51824753556",
 *   "isPsiEligible": false
 * }
 * ```
 */
export class CreateClientDto {
  /**
   * Client's legal name.
   * Must be non-empty and max 255 characters.
   * @example "Acme Corporation Pty Ltd"
   */
  @IsString()
  @IsNotEmpty({ message: 'Client name is required' })
  @MaxLength(255, { message: 'Client name must be 255 characters or less' })
  name!: string;

  /**
   * Australian Business Number (11 digits).
   * Optional - some clients may not have an ABN.
   * @example "51824753556"
   */
  @IsString()
  @IsOptional()
  @Matches(/^\d{11}$/, {
    message: 'ABN must be exactly 11 digits',
  })
  abn?: string;

  /**
   * Whether the client's payments are subject to Personal Services Income (PSI) rules.
   * PSI rules affect which deductions can be claimed.
   * @default false
   */
  @IsBoolean()
  @IsOptional()
  isPsiEligible?: boolean;
}
