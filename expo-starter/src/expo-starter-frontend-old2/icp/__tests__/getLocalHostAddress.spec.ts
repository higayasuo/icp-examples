import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getLocalHostAddress } from '../getLocalHostAddress';

// Mock react-native Platform
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Mock expo-constants
vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'test-app',
      slug: 'test-app',
      hostUri: '192.168.1.5:8081',
    },
  },
}));

describe('getLocalHostAddress', () => {
  const mockedPlatform = vi.mocked(Platform);
  const mockedConstants = vi.mocked(Constants);

  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetModules();
    vi.clearAllMocks();

    // Set default values
    mockedConstants.expoConfig = {
      name: 'test-app',
      slug: 'test-app',
      hostUri: '192.168.1.5:8081',
    };
  });

  it('should return "10.0.2.2" for Android platform', () => {
    mockedPlatform.OS = 'android';
    expect(getLocalHostAddress()).toBe('10.0.2.2');
  });

  it('should return "localhost" for web platform', () => {
    mockedPlatform.OS = 'web';
    expect(getLocalHostAddress()).toBe('localhost');
  });

  it('should return IP address from hostUri for iOS platform', () => {
    mockedPlatform.OS = 'ios';
    expect(getLocalHostAddress()).toBe('192.168.1.5');
  });

  it('should return "127.0.0.1" for iOS platform when hostUri is not available', () => {
    mockedPlatform.OS = 'ios';
    mockedConstants.expoConfig = {
      name: 'test-app',
      slug: 'test-app',
      hostUri: undefined,
    };
    expect(getLocalHostAddress()).toBe('127.0.0.1');
  });
});
