import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeCrypto } from '../NativeCrypto';
import * as ExpoCrypto from 'expo-crypto';
import crypto from 'crypto';

// Mock expo-crypto's getRandomBytes
vi.mock('expo-crypto', () => ({
  getRandomBytes: vi.fn(),
  digestStringAsync: vi.fn(),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  CryptoEncoding: {
    BASE64: 'base64',
  },
}));

describe('NativeCrypto', () => {
  let nativeCrypto: NativeCrypto;
  let mockRandomValues: Uint8Array;

  beforeEach(() => {
    nativeCrypto = new NativeCrypto();
    // Reset all mocks
    vi.clearAllMocks();
    // Use Node.js crypto.randomBytes for predictable testing
    vi.mocked(ExpoCrypto.getRandomBytes).mockImplementation((size: number) => {
      return crypto.randomBytes(size);
    });
  });

  describe('AES-CBC encryption/decryption with HMAC', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const key = new Uint8Array(32).fill(2); // 32-byte key filled with 2s
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      // Encrypt the data
      const encrypted = await nativeCrypto.aesEncryptAsync(testData, key);
      expect(encrypted.length).toBeGreaterThan(testData.length);
      expect(ExpoCrypto.getRandomBytes).toHaveBeenCalledTimes(2); // IV and HMAC key

      // Decrypt the data
      const decrypted = await nativeCrypto.aesDecryptAsync(encrypted, key);
      expect(Array.from(decrypted)).toEqual(Array.from(testData));
    });

    it('should generate different ciphertexts for same data', async () => {
      const key = new Uint8Array(32).fill(2);
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted1 = await nativeCrypto.aesEncryptAsync(testData, key);
      const encrypted2 = await nativeCrypto.aesEncryptAsync(testData, key);

      // Should be different due to random IV and HMAC key
      expect(Buffer.from(encrypted1)).not.toEqual(Buffer.from(encrypted2));

      // But both should decrypt to the same data
      const decrypted1 = await nativeCrypto.aesDecryptAsync(encrypted1, key);
      const decrypted2 = await nativeCrypto.aesDecryptAsync(encrypted2, key);

      expect(Array.from(decrypted1)).toEqual(Array.from(testData));
      expect(Array.from(decrypted2)).toEqual(Array.from(testData));
    });

    it('should fail to decrypt with wrong key', async () => {
      const key1 = new Uint8Array(32).fill(2);
      const key2 = new Uint8Array(32).fill(3);
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted = await nativeCrypto.aesEncryptAsync(testData, key1);
      await expect(
        nativeCrypto.aesDecryptAsync(encrypted, key2),
      ).rejects.toThrow();
    });

    it('should fail to decrypt with tampered HMAC', async () => {
      const key = new Uint8Array(32).fill(2);
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted = await nativeCrypto.aesEncryptAsync(testData, key);
      // Tamper with HMAC
      encrypted[encrypted.length - 32] ^= 1;

      await expect(
        nativeCrypto.aesDecryptAsync(encrypted, key),
      ).rejects.toThrow('Invalid HMAC');
    });

    it('should handle empty data', async () => {
      const key = new Uint8Array(32).fill(2);
      const testData = new Uint8Array(0);

      const encrypted = await nativeCrypto.aesEncryptAsync(testData, key);
      const decrypted = await nativeCrypto.aesDecryptAsync(encrypted, key);

      expect(Array.from(decrypted)).toEqual(Array.from(testData));
    });

    it('should handle large data', async () => {
      const key = new Uint8Array(32).fill(2);
      const testData = new Uint8Array(1024).fill(5); // 1KB of data

      const encrypted = await nativeCrypto.aesEncryptAsync(testData, key);
      const decrypted = await nativeCrypto.aesDecryptAsync(encrypted, key);

      expect(Array.from(decrypted)).toEqual(Array.from(testData));
    });
  });
});
