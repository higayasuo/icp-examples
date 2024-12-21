import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getProfileName, getConfig } from './config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getProfileName', () => {
    it('should return development when EAS_BUILD_PROFILE is not set', () => {
      delete process.env.EAS_BUILD_PROFILE;
      expect(getProfileName()).toBe('development');
    });

    it('should return the value of EAS_BUILD_PROFILE when it is set', () => {
      process.env.EAS_BUILD_PROFILE = 'production';
      expect(getProfileName()).toBe('production');
    });
  });

  describe('getConfig', () => {
    it('should return development config when profile is development', () => {
      delete process.env.EAS_BUILD_PROFILE;
      const config = getConfig();
      expect(config.backendCanisterId).toBe('bkyz2-fmaaa-aaaaa-qaaaq-cai');
    });

    it('should return preview config when profile is preview', () => {
      process.env.EAS_BUILD_PROFILE = 'preview';
      const config = getConfig();
      expect(config.backendCanisterId).toBe('');
    });

    it('should return production config when profile is production', () => {
      process.env.EAS_BUILD_PROFILE = 'production';
      const config = getConfig();
      expect(config.backendCanisterId).toBe('');
    });

    it('should throw error when profile is invalid', () => {
      process.env.EAS_BUILD_PROFILE = 'invalid';
      expect(() => getConfig()).toThrow('Invalid profile name');
    });
  });
});
