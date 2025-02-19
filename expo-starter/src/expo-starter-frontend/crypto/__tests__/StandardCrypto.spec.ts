import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StandardCrypto, textEncodeLite } from '../StandardCrypto';

// Mock crypto API
const mockCrypto = {
  getRandomValues: (array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
  subtle: {
    digest: async (algorithm: string, data: Uint8Array) => {
      // Simple mock implementation for testing
      if (algorithm === 'SHA-256') {
        if (data.length === 0) {
          return new Uint8Array(
            Buffer.from(
              '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
              'base64',
            ),
          );
        }
        if (new TextDecoder().decode(data) === 'test') {
          return new Uint8Array(
            Buffer.from(
              'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
              'base64',
            ),
          );
        }
        // For other inputs, generate a random hash
        const result = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          result[i] = Math.floor(Math.random() * 256);
        }
        return result;
      }
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    },
  },
};

// Spy on the mock functions
vi.spyOn(mockCrypto, 'getRandomValues');
vi.spyOn(mockCrypto.subtle, 'digest');

describe('StandardCrypto', () => {
  let crypto: StandardCrypto;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    // Set up global crypto
    global.crypto = mockCrypto as unknown as Crypto;
    crypto = new StandardCrypto();
  });

  describe('getRandomBytes', () => {
    it('should return Uint8Array of specified size', () => {
      const size = 32;
      const result = crypto.getRandomBytes(size);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(size);
      expect(mockCrypto.getRandomValues).toHaveBeenCalled();
    });

    it('should generate different values on each call', () => {
      const size = 32;
      const result1 = crypto.getRandomBytes(size);
      const result2 = crypto.getRandomBytes(size);
      expect(result1).not.toEqual(result2);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2);
    });
  });

  describe('sha256Async', () => {
    it('should generate base64 encoded SHA-256 hash', async () => {
      const input = 'test';
      const result = await crypto.sha256Async(input);
      expect(result).toBe('n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=');
      expect(mockCrypto.subtle.digest).toHaveBeenCalled();
    });

    it('should generate different hashes for different inputs', async () => {
      const input1 = 'test1';
      const input2 = 'test2';
      const result1 = await crypto.sha256Async(input1);
      const result2 = await crypto.sha256Async(input2);
      expect(result1).not.toBe(result2);
      expect(mockCrypto.subtle.digest).toHaveBeenCalledTimes(2);
    });

    it('should handle empty string', async () => {
      const input = '';
      const result = await crypto.sha256Async(input);
      expect(result).toBe('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
      expect(mockCrypto.subtle.digest).toHaveBeenCalled();
    });
  });

  describe('textEncodeLite', () => {
    it('should encode ASCII string to Uint8Array', () => {
      const input = 'Hello';
      const result = textEncodeLite(input);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(input.length);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // ASCII values for 'Hello'
    });

    it('should handle empty string', () => {
      const input = '';
      const result = textEncodeLite(input);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should handle special characters', () => {
      const input = '!@#$%';
      const result = textEncodeLite(input);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(input.length);
      expect(Array.from(result)).toEqual([33, 64, 35, 36, 37]); // ASCII values for '!@#$%'
    });
  });
});
