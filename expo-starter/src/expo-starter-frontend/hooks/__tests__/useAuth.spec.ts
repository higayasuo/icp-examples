import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '../useAuth';
import { renderHook } from '@testing-library/react-hooks';
import { useState, useEffect } from 'react';

vi.mock('react', () => ({
  useState: vi.fn((initialValue) => [initialValue, vi.fn()]),
  useEffect: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}));

vi.mock('expo-linking', () => ({
  useURL: vi.fn(),
  createURL: vi.fn(),
}));

vi.mock('expo-web-browser', () => ({
  openBrowserAsync: vi.fn(),
  dismissBrowser: vi.fn(),
}));

vi.mock('expo-router', () => ({
  router: {
    replace: vi.fn(),
  },
  usePathname: vi.fn(),
}));

vi.mock('@/icp/getCanisterURL', () => ({
  getCanisterURL: vi.fn(),
}));

vi.mock('@/icp/env.generated', () => ({
  ENV_VARS: {
    DFX_NETWORK: 'local',
    CANISTER_ID_II_INTEGRATION: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  },
}));

vi.mock('@/icp/getInternetIdentityURL', () => ({
  getInternetIdentityURL: vi.fn(),
}));

/**
 * Test suite for useAuth hook
 */
describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test if useAuth is a valid React Hook
   */
  it('should be a valid React Hook', () => {
    expect(useAuth.name).toBe('useAuth');
    expect(() => renderHook(() => useAuth())).not.toThrow();
  });

  /**
   * Test if useAuth returns the expected initial state
   */
  it('should return initial state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current).toHaveProperty('identity', undefined);
    expect(result.current).toHaveProperty('isReady', false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });
});
