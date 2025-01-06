import { describe, it, expect, vi, afterEach } from 'vitest';
import { Platform } from 'react-native';
import { isSubdomainSupported } from '../isSubdomainSupported';

vi.mock('react-native', () => {
  let currentOS = 'web';
  return {
    Platform: {
      get OS() {
        return currentOS;
      },
      set OS(value) {
        currentOS = value;
      },
    },
  };
});

describe('isSubdomainSupported', () => {
  const originalURL = global.URL;

  afterEach(() => {
    vi.restoreAllMocks();
    global.URL = originalURL;
  });

  it('should return true when URL with subdomain is supported', () => {
    // Ensure URL constructor doesn't throw for localhost subdomains
    vi.spyOn(global, 'URL').mockImplementation((url) => {
      return new originalURL(url);
    });

    expect(isSubdomainSupported()).toBe(true);
  });

  it('should return false when URL with subdomain is not supported', () => {
    vi.spyOn(global, 'URL').mockImplementation(() => {
      throw new Error('Invalid URL');
    });

    expect(isSubdomainSupported()).toBe(false);
  });

  it('should return false on iOS', () => {
    Platform.OS = 'ios';
    expect(isSubdomainSupported()).toBe(false);
  });

  it('should return false on Android', () => {
    Platform.OS = 'android';
    expect(isSubdomainSupported()).toBe(false);
  });
});
