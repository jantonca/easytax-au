import { EncryptedColumnTransformer } from './encrypted-column.transformer';
import { Logger } from '@nestjs/common';

describe('EncryptedColumnTransformer', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  // Valid 32-byte key (64 hex chars)
  const testKey = 'a'.repeat(64);

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe('encryption and decryption', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const transformer = new EncryptedColumnTransformer();
      const plaintext = 'Hello, World!';

      const encrypted = transformer.to(plaintext);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (unique IV)', () => {
      const transformer = new EncryptedColumnTransformer();
      const plaintext = 'Same message';

      const encrypted1 = transformer.to(plaintext);
      const encrypted2 = transformer.to(plaintext);

      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to the same value
      expect(transformer.from(encrypted1)).toBe(plaintext);
      expect(transformer.from(encrypted2)).toBe(plaintext);
    });

    it('should handle empty string', () => {
      const transformer = new EncryptedColumnTransformer();
      const plaintext = '';

      const encrypted = transformer.to(plaintext);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const transformer = new EncryptedColumnTransformer();
      const plaintext = '日本語テスト 🎉 émojis';

      const encrypted = transformer.to(plaintext);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', () => {
      const transformer = new EncryptedColumnTransformer();
      const plaintext = 'x'.repeat(10000);

      const encrypted = transformer.to(plaintext);
      const decrypted = transformer.from(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('null handling', () => {
    it('should return null when encrypting null', () => {
      const transformer = new EncryptedColumnTransformer();

      expect(transformer.to(null)).toBeNull();
    });

    it('should return null when decrypting null', () => {
      const transformer = new EncryptedColumnTransformer();

      expect(transformer.from(null)).toBeNull();
    });

    it('should return null when encrypting undefined', () => {
      const transformer = new EncryptedColumnTransformer();

      expect(transformer.to(undefined as unknown as string)).toBeNull();
    });
  });

  describe('legacy data handling', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      // Spy on Logger.warn to verify warning is logged
      warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('should return unencrypted data as-is and log warning (no colons)', () => {
      const transformer = new EncryptedColumnTransformer();
      const legacyValue = 'plain text without colons';

      const result = transformer.from(legacyValue);

      expect(result).toBe(legacyValue);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Encountered unencrypted data'));
    });

    it('should return value with single colon as-is and log warning', () => {
      const transformer = new EncryptedColumnTransformer();
      const legacyValue = 'part1:part2';

      const result = transformer.from(legacyValue);

      expect(result).toBe(legacyValue);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Encountered unencrypted data'));
    });
  });

  describe('error handling', () => {
    it('should throw if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      const transformer = new EncryptedColumnTransformer();

      expect(() => transformer.to('test')).toThrow(
        'ENCRYPTION_KEY environment variable is not set',
      );
    });

    it('should throw if ENCRYPTION_KEY is wrong length', () => {
      process.env.ENCRYPTION_KEY = 'tooshort';
      const transformer = new EncryptedColumnTransformer();

      expect(() => transformer.to('test')).toThrow('ENCRYPTION_KEY must be 64 hex characters');
    });

    it('should throw on tampered ciphertext', () => {
      const transformer = new EncryptedColumnTransformer();
      const encrypted = transformer.to('secret');

      // Tamper with the ciphertext portion
      const parts = encrypted!.split(':');
      parts[2] = 'ff'.repeat(parts[2].length / 2);
      const tampered = parts.join(':');

      expect(() => transformer.from(tampered)).toThrow();
    });

    it('should throw on tampered auth tag', () => {
      const transformer = new EncryptedColumnTransformer();
      const encrypted = transformer.to('secret');

      // Tamper with the auth tag
      const parts = encrypted!.split(':');
      parts[1] = 'ff'.repeat(16);
      const tampered = parts.join(':');

      expect(() => transformer.from(tampered)).toThrow();
    });
  });

  describe('format validation', () => {
    it('should produce encrypted string in iv:authTag:ciphertext format', () => {
      const transformer = new EncryptedColumnTransformer();
      const encrypted = transformer.to('test');

      expect(encrypted).not.toBeNull();
      const parts = encrypted!.split(':');
      expect(parts).toHaveLength(3);

      // IV should be 12 bytes = 24 hex chars
      expect(parts[0]).toHaveLength(24);
      // Auth tag should be 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32);
      // Ciphertext length varies
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });
});
