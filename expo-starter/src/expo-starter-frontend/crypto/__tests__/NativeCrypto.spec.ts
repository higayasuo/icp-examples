import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nativeCrypto } from '../NativeCrypto';
import * as expoCrypto from 'expo-crypto';

vi.mock('expo-crypto', () => ({
  getRandomBytes: vi.fn((size: number) => new Uint8Array(size).fill(1)),
  digestStringAsync: vi.fn(async (_, input: string) => {
    // Mock implementation that returns known values for specific inputs
    const mockResults: { [key: string]: string } = {
      test: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
      test1: 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=',
      test2: 'Ayg8YqmYXJqY8l/WPGzHBhT/4ra4BO1dlgYB0tW8Y5k=',
      '': '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
    };
    return mockResults[input] || mockResults['test'];
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  CryptoEncoding: {
    BASE64: 'base64',
  },
}));

describe('NativeCrypto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRandomBytes', () => {
    it('should return Uint8Array of specified size', () => {
      const size = 32;
      const result = nativeCrypto.getRandomBytes(size);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(size);
    });

    it('should call expo-crypto getRandomBytes with correct size', () => {
      const size = 32;
      nativeCrypto.getRandomBytes(size);
      expect(expoCrypto.getRandomBytes).toHaveBeenCalledWith(size);
      expect(expoCrypto.getRandomBytes).toHaveBeenCalledTimes(1);
    });
  });

  describe('sha256Async', () => {
    it('should generate base64 encoded SHA-256 hash', async () => {
      const input = 'test';
      const result = await nativeCrypto.sha256Async(input);
      expect(result).toBe('n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=');
    });

    it('should generate different hashes for different inputs', async () => {
      const input1 = 'test1';
      const input2 = 'test2';
      const result1 = await nativeCrypto.sha256Async(input1);
      const result2 = await nativeCrypto.sha256Async(input2);
      expect(result1).not.toBe(result2);
    });

    it('should handle empty string', async () => {
      const input = '';
      const result = await nativeCrypto.sha256Async(input);
      expect(result).toBe('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
    });

    it('should call expo-crypto digestStringAsync with correct parameters', async () => {
      const input = 'test';
      await nativeCrypto.sha256Async(input);
      expect(expoCrypto.digestStringAsync).toHaveBeenCalledWith(
        expoCrypto.CryptoDigestAlgorithm.SHA256,
        input,
        {
          encoding: expoCrypto.CryptoEncoding.BASE64,
        },
      );
      expect(expoCrypto.digestStringAsync).toHaveBeenCalledTimes(1);
    });
  });
});
