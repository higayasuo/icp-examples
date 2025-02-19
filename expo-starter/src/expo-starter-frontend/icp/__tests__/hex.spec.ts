import { describe, it, expect } from 'vitest';
import { toHex, fromHex } from '../hex';

describe('hex', () => {
  it('should convert Uint8Array to hex string', () => {
    const bytes = new Uint8Array([0, 1, 255, 16, 17]);
    const hex = toHex(bytes);
    expect(hex).toBe('0001ff1011');
  });

  it('should convert hex string to Uint8Array', () => {
    const hex = '0001ff1011';
    const bytes = fromHex(hex);
    expect(bytes).toEqual(new Uint8Array([0, 1, 255, 16, 17]));
  });

  it('should handle empty Uint8Array', () => {
    const bytes = new Uint8Array([]);
    const hex = toHex(bytes);
    expect(hex).toBe('');
  });

  it('should handle empty hex string', () => {
    const hex = '';
    const bytes = fromHex(hex);
    expect(bytes).toEqual(new Uint8Array([]));
  });

  it('should handle single byte values', () => {
    const bytes = new Uint8Array([15]); // 0x0f
    const hex = toHex(bytes);
    expect(hex).toBe('0f');
  });

  it('should handle zero bytes', () => {
    const bytes = new Uint8Array([0, 0, 0]);
    const hex = toHex(bytes);
    expect(hex).toBe('000000');
  });

  it('should convert back and forth correctly', () => {
    const original = new Uint8Array([1, 2, 3, 255, 0, 128]);
    const hex = toHex(original);
    const result = fromHex(hex);
    expect(result).toEqual(original);
  });
});
