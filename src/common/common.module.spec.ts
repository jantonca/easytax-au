import { Test } from '@nestjs/testing';
import { CommonModule } from './common.module';

describe('CommonModule', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    // Restore original environment after each test
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('onModuleInit - ENCRYPTION_KEY validation', () => {
    it('should succeed with valid 64-character hex key', async () => {
      process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 64 hex characters

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      // Should not throw
      expect(() => commonModule.onModuleInit()).not.toThrow();
    });

    it('should succeed with mixed case hex key', async () => {
      // 64 hex characters with mixed case: 16 + 16 + 32 = 64
      process.env.ENCRYPTION_KEY = 'aAbBcCdDeEfF0123' + 'AABBCCDD00112233' + '0'.repeat(32);

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).not.toThrow();
    });

    it('should throw if ENCRYPTION_KEY is not set', async () => {
      delete process.env.ENCRYPTION_KEY;

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow(
        'ENCRYPTION_KEY environment variable is not set',
      );
    });

    it('should throw if ENCRYPTION_KEY is empty string', async () => {
      process.env.ENCRYPTION_KEY = '';

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow(
        'ENCRYPTION_KEY environment variable is not set',
      );
    });

    it('should throw if ENCRYPTION_KEY is too short', async () => {
      process.env.ENCRYPTION_KEY = 'a'.repeat(32); // Only 32 chars, need 64

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow(
        'ENCRYPTION_KEY must be exactly 64 hexadecimal characters',
      );
    });

    it('should throw if ENCRYPTION_KEY is too long', async () => {
      process.env.ENCRYPTION_KEY = 'a'.repeat(128); // 128 chars, need 64

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow(
        'ENCRYPTION_KEY must be exactly 64 hexadecimal characters',
      );
    });

    it('should throw if ENCRYPTION_KEY contains non-hex characters', async () => {
      process.env.ENCRYPTION_KEY = 'g'.repeat(64); // 'g' is not hex

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow(
        'ENCRYPTION_KEY must be exactly 64 hexadecimal characters',
      );
    });

    it('should throw if ENCRYPTION_KEY contains spaces', async () => {
      process.env.ENCRYPTION_KEY = 'a'.repeat(32) + ' ' + 'a'.repeat(31);

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow(
        'ENCRYPTION_KEY must be exactly 64 hexadecimal characters',
      );
    });

    it('should include helpful generation command in error message when key missing', async () => {
      delete process.env.ENCRYPTION_KEY;

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow('openssl rand -hex 32');
    });

    it('should include current length in error message when wrong size', async () => {
      process.env.ENCRYPTION_KEY = 'abc123'; // 6 chars

      const moduleRef = await Test.createTestingModule({
        imports: [CommonModule],
      }).compile();

      const commonModule = moduleRef.get(CommonModule);

      expect(() => commonModule.onModuleInit()).toThrow('Current length: 6');
    });
  });
});
