import { FileValidator } from '@nestjs/common';

export interface CsvFileValidatorOptions {
  errorMessage?: string;
}

/**
 * Validates that uploaded file has .csv extension.
 * MIME type validation is unreliable as browsers/systems may send different types.
 */
export class CsvFileValidator extends FileValidator<CsvFileValidatorOptions> {
  buildErrorMessage(): string {
    return this.validationOptions?.errorMessage ?? 'File must be a CSV file (.csv extension)';
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) {
      return false;
    }

    // Check file extension
    const filename = file.originalname.toLowerCase();
    if (!filename.endsWith('.csv')) {
      return false;
    }

    // Optionally check MIME type if provided by browser
    // Accept common CSV MIME types but don't require them
    if (file.mimetype) {
      const acceptedTypes = [
        'text/csv',
        'application/csv',
        'text/x-csv',
        'application/octet-stream',
      ];
      if (!acceptedTypes.includes(file.mimetype)) {
        return false;
      }
    }

    return true;
  }
}
