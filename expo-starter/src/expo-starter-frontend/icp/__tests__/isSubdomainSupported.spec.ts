import { Platform } from 'react-native';
import { isLocalhostSubdomainSupported } from '../isLocalhostSubdomainSupported';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

describe('isSubdomainSupported', () => {
  const originalWindow = global.window;
  const originalURL = global.URL;

  beforeEach(() => {
    // Mock window object
    global.window = {
      location: {
        origin: 'http://localhost:3000',
      },
      navigator: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    } as any;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.URL = originalURL;
  });

  it('should return false for iOS platform', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
    expect(isLocalhostSubdomainSupported()).toBe(false);
  });

  it('should return false for Android platform', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('android');
    expect(isLocalhostSubdomainSupported()).toBe(false);
  });

  it('should return false when accessed from IP address origin', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    global.window = {
      location: {
        origin: 'http://192.168.0.44:24943',
      },
      navigator: {
        userAgent: 'Mozilla/5.0 Chrome',
      },
    } as any;
    expect(isLocalhostSubdomainSupported()).toBe(false);
  });

  it('should return false for Safari browser', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    global.window = {
      location: {
        origin: 'http://localhost:3000',
      },
      navigator: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      },
    } as any;
    expect(isLocalhostSubdomainSupported()).toBe(false);
  });

  it('should return true for Chrome browser', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    global.window = {
      location: {
        origin: 'http://localhost:3000',
      },
      navigator: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    } as any;
    expect(isLocalhostSubdomainSupported()).toBe(true);
  });

  it('should return false when window.location is undefined', () => {
    global.window = {} as any;
    expect(isLocalhostSubdomainSupported()).toBe(false);
  });

  it('should return false when not on localhost', () => {
    global.window = {
      location: {
        origin: 'http://example.com',
      },
      navigator: {
        userAgent: 'Mozilla/5.0 Chrome',
      },
    } as any;
    expect(isLocalhostSubdomainSupported()).toBe(false);
  });
});
