import { Platform } from 'react-native';
import { isSubdomainSupported } from '../isSubdomainSupported';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

describe('isSubdomainSupported', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset window object before each test
    global.window = originalWindow;
  });

  it('should return false for iOS platform', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
    expect(isSubdomainSupported()).toBe(false);
  });

  it('should return false for Android platform', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('android');
    expect(isSubdomainSupported()).toBe(false);
  });

  it('should return false when accessed from IP address origin', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    global.window = {
      location: {
        origin: 'http://192.168.0.44:24943',
      },
    } as any;
    expect(isSubdomainSupported()).toBe(false);
  });

  it('should return true when accessed from localhost and subdomain is supported', () => {
    vi.spyOn(Platform, 'OS', 'get').mockReturnValue('web');
    global.window = {
      location: {
        origin: 'http://localhost:24943',
      },
    } as any;
    expect(isSubdomainSupported()).toBe(true);
  });
});
