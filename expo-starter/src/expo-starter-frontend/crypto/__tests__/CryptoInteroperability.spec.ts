import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeCrypto } from '../NativeCrypto';
import { StandardCrypto } from '../StandardCrypto';
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

describe('Crypto Interoperability', () => {
  let nativeCrypto: NativeCrypto;
  let standardCrypto: StandardCrypto;

  beforeEach(() => {
    nativeCrypto = new NativeCrypto();
    standardCrypto = new StandardCrypto();
    // Reset all mocks
    vi.clearAllMocks();
    // Use Node.js crypto.randomBytes for predictable testing
    vi.mocked(ExpoCrypto.getRandomBytes).mockImplementation((size: number) => {
      return crypto.randomBytes(size);
    });
  });

  describe('Cross-implementation encryption/decryption', () => {
    it('should decrypt NativeCrypto encrypted data with StandardCrypto', async () => {
      const key = new Uint8Array(32).fill(2); // 32-byte key filled with 2s
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      // Encrypt with NativeCrypto
      const encrypted = await nativeCrypto.aesEncryptAsync(testData, key);
      expect(encrypted.length).toBeGreaterThan(testData.length);

      // Decrypt with StandardCrypto
      const decrypted = await standardCrypto.aesDecryptAsync(encrypted, key);
      expect(Array.from(decrypted)).toEqual(Array.from(testData));
    });

    it('should decrypt StandardCrypto encrypted data with NativeCrypto', async () => {
      const key = new Uint8Array(32).fill(3); // 32-byte key filled with 3s
      const testData = new Uint8Array([6, 7, 8, 9, 10]);

      // Encrypt with StandardCrypto
      const encrypted = await standardCrypto.aesEncryptAsync(testData, key);
      expect(encrypted.length).toBeGreaterThan(testData.length);

      // Decrypt with NativeCrypto
      const decrypted = await nativeCrypto.aesDecryptAsync(encrypted, key);
      expect(Array.from(decrypted)).toEqual(Array.from(testData));
    });

    it('should handle empty data across implementations', async () => {
      const key = new Uint8Array(32).fill(4);
      const testData = new Uint8Array(0);

      // Test NativeCrypto -> StandardCrypto
      const encryptedNative = await nativeCrypto.aesEncryptAsync(testData, key);
      const decryptedStandard = await standardCrypto.aesDecryptAsync(
        encryptedNative,
        key,
      );
      expect(Array.from(decryptedStandard)).toEqual(Array.from(testData));

      // Test StandardCrypto -> NativeCrypto
      const encryptedStandard = await standardCrypto.aesEncryptAsync(
        testData,
        key,
      );
      const decryptedNative = await nativeCrypto.aesDecryptAsync(
        encryptedStandard,
        key,
      );
      expect(Array.from(decryptedNative)).toEqual(Array.from(testData));
    });

    it('should handle large data across implementations', async () => {
      const key = new Uint8Array(32).fill(5);
      const testData = new Uint8Array(1024).fill(7); // 1KB of data

      // Test NativeCrypto -> StandardCrypto
      const encryptedNative = await nativeCrypto.aesEncryptAsync(testData, key);
      const decryptedStandard = await standardCrypto.aesDecryptAsync(
        encryptedNative,
        key,
      );
      expect(Array.from(decryptedStandard)).toEqual(Array.from(testData));

      // Test StandardCrypto -> NativeCrypto
      const encryptedStandard = await standardCrypto.aesEncryptAsync(
        testData,
        key,
      );
      const decryptedNative = await nativeCrypto.aesDecryptAsync(
        encryptedStandard,
        key,
      );
      expect(Array.from(decryptedNative)).toEqual(Array.from(testData));
    });

    it('should fail to decrypt with wrong key across implementations', async () => {
      const key1 = new Uint8Array(32).fill(6);
      const key2 = new Uint8Array(32).fill(7);
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      // Test NativeCrypto -> StandardCrypto
      const encryptedNative = await nativeCrypto.aesEncryptAsync(
        testData,
        key1,
      );
      await expect(
        standardCrypto.aesDecryptAsync(encryptedNative, key2),
      ).rejects.toThrow();

      // Test StandardCrypto -> NativeCrypto
      const encryptedStandard = await standardCrypto.aesEncryptAsync(
        testData,
        key1,
      );
      await expect(
        nativeCrypto.aesDecryptAsync(encryptedStandard, key2),
      ).rejects.toThrow();
    });

    it('should fail to decrypt with tampered HMAC across implementations', async () => {
      const key = new Uint8Array(32).fill(8);
      const testData = new Uint8Array([1, 2, 3, 4, 5]);

      // Test NativeCrypto -> StandardCrypto
      const encryptedNative = await nativeCrypto.aesEncryptAsync(testData, key);
      encryptedNative[encryptedNative.length - 1] ^= 1; // Tamper with HMAC
      await expect(
        standardCrypto.aesDecryptAsync(encryptedNative, key),
      ).rejects.toThrow('Invalid HMAC');

      // Test StandardCrypto -> NativeCrypto
      const encryptedStandard = await standardCrypto.aesEncryptAsync(
        testData,
        key,
      );
      encryptedStandard[encryptedStandard.length - 1] ^= 1; // Tamper with HMAC
      await expect(
        nativeCrypto.aesDecryptAsync(encryptedStandard, key),
      ).rejects.toThrow('Invalid HMAC');
    });
  });
});
