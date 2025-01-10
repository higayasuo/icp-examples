import { describe, it, expect } from 'vitest';

/**
 * Tests for URL encoding behavior in useAuth hook
 */
describe('URL encoding behavior', () => {
  /**
   * Test that URLSearchParams automatically handles URL encoding
   */
  it('should properly encode special characters in URL parameters', () => {
    const mockRedirectUri = 'exp://192.168.1.1:8081/redirect';
    const url = new URL('https://example.com');

    url.searchParams.set('redirect_uri', mockRedirectUri);

    // URLSearchParams should properly encode special characters
    expect(url.toString()).toBe(
      'https://example.com/?redirect_uri=exp%3A%2F%2F192.168.1.1%3A8081%2Fredirect',
    );
  });

  /**
   * Test that using encodeURIComponent with URLSearchParams causes double encoding
   */
  it('should demonstrate that using encodeURIComponent causes double encoding', () => {
    const mockRedirectUri = 'exp://192.168.1.1:8081/redirect';
    const url = new URL('https://example.com');

    url.searchParams.set('redirect_uri', encodeURIComponent(mockRedirectUri));

    // This shows the undesired double encoding
    expect(url.toString()).toBe(
      'https://example.com/?redirect_uri=exp%253A%252F%252F192.168.1.1%253A8081%252Fredirect',
    );
  });

  /**
   * Test that URLSearchParams.get() automatically decodes the value
   */
  it('should automatically decode URL parameters when using get()', () => {
    const originalUri = 'exp://192.168.1.1:8081/redirect';
    const url = new URL('https://example.com');
    url.searchParams.set('redirect_uri', originalUri);

    // URLSearchParams.get() should automatically decode the value
    const decoded = new URL(url.toString()).searchParams.get('redirect_uri');
    expect(decoded).toBe(originalUri);
  });
});
