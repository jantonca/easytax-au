import { CsvFileValidator } from './csv-file.validator';

describe('CsvFileValidator', () => {
  let validator: CsvFileValidator;

  beforeEach(() => {
    validator = new CsvFileValidator({});
  });

  describe('isValid', () => {
    it('should accept files with .csv extension and text/csv MIME type', () => {
      const file = {
        originalname: 'test.csv',
        mimetype: 'text/csv',
      } as Express.Multer.File;

      expect(validator.isValid(file)).toBe(true);
    });

    it('should accept files with .csv extension and application/octet-stream MIME type', () => {
      const file = {
        originalname: 'test.csv',
        mimetype: 'application/octet-stream',
      } as Express.Multer.File;

      expect(validator.isValid(file)).toBe(true);
    });

    it('should accept files with .CSV extension (case insensitive)', () => {
      const file = {
        originalname: 'test.CSV',
        mimetype: 'text/csv',
      } as Express.Multer.File;

      expect(validator.isValid(file)).toBe(true);
    });

    it('should reject files without .csv extension', () => {
      const file = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
      } as Express.Multer.File;

      expect(validator.isValid(file)).toBe(false);
    });

    it('should reject files with wrong MIME type even if extension is .csv', () => {
      const file = {
        originalname: 'test.csv',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      expect(validator.isValid(file)).toBe(false);
    });

    it('should reject undefined file', () => {
      expect(validator.isValid(undefined)).toBe(false);
    });
  });

  describe('buildErrorMessage', () => {
    it('should return default error message', () => {
      expect(validator.buildErrorMessage()).toBe('File must be a CSV file (.csv extension)');
    });

    it('should return custom error message', () => {
      const customValidator = new CsvFileValidator({
        errorMessage: 'Custom CSV error',
      });

      expect(customValidator.buildErrorMessage()).toBe('Custom CSV error');
    });
  });
});
