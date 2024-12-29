import { describe, it, expect, vi, afterEach } from 'vitest';
import { isSubdomainSupported } from '../isSubdomainSupported';

describe('isSubdomainSupported', () => {
  const originalURL = global.URL;

  afterEach(() => {
    global.URL = originalURL;
  });

  it('should return true when URL with subdomain is supported', () => {
    expect(isSubdomainSupported()).toBe(true);
  });

  it('should return false when URL with subdomain is not supported', () => {
    global.URL = vi.fn(() => {
      throw new Error('Invalid URL');
    }) as any;

    expect(isSubdomainSupported()).toBe(false);
  });
});
