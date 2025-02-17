import { describe, it, expect, beforeEach } from 'vitest';
import { StandardCrypto, textEncodeLite } from '../StandardCrypto';

describe('StandardCrypto', () => {
  let crypto: StandardCrypto;

  beforeEach(() => {
    crypto = new StandardCrypto();
  });

  describe('getRandomBytes', () => {
    it('should return Uint8Array of specified size', () => {
      const size = 32;
      const result = crypto.getRandomBytes(size);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(size);
    });

    it('should generate different values on each call', () => {
      const size = 32;
      const result1 = crypto.getRandomBytes(size);
      const result2 = crypto.getRandomBytes(size);
      expect(result1).not.toEqual(result2);
    });
  });

  describe('sha256Async', () => {
    it('should generate base64 encoded SHA-256 hash', async () => {
      const input = 'test';
      const result = await crypto.sha256Async(input);

      // SHA-256 hash of 'test' in base64
      // n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=
      expect(result).toBe('n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=');
    });

    it('should generate different hashes for different inputs', async () => {
      const input1 = 'test1';
      const input2 = 'test2';
      const result1 = await crypto.sha256Async(input1);
      const result2 = await crypto.sha256Async(input2);
      expect(result1).not.toBe(result2);
    });

    it('should handle empty string', async () => {
      const input = '';
      const result = await crypto.sha256Async(input);
      // SHA-256 hash of empty string in base64
      // 47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=
      expect(result).toBe('47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=');
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
