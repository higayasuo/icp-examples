import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCanisterURL } from '../getCanisterURL';
import { DfxNetwork } from '../types';

// Mock modules
const mockGetDfxNetwork = vi.fn();
const mockGetLocalHostAddress = vi.fn();

vi.mock('../getDfxNetwork', () => ({
  getDfxNetwork: () => mockGetDfxNetwork(),
}));

vi.mock('../getLocalHostAddress', () => ({
  getLocalHostAddress: () => mockGetLocalHostAddress(),
}));

describe('getCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ic0.app URL when network is "ic"', () => {
    mockGetDfxNetwork.mockReturnValue('ic');

    const url = getCanisterURL(mockCanisterId);

    expect(url).toBe(`https://${mockCanisterId}.ic0.app`);
  });

  it('should return localhost URL with port when network is "local"', () => {
    mockGetDfxNetwork.mockReturnValue('local');
    mockGetLocalHostAddress.mockReturnValue('127.0.0.1');

    const url = getCanisterURL(mockCanisterId);

    expect(url).toBe(`http://127.0.0.1:4943?canisterId=${mockCanisterId}`);
  });

  it('should return localhost URL with port when network is "playground"', () => {
    mockGetDfxNetwork.mockReturnValue('playground');
    mockGetLocalHostAddress.mockReturnValue('localhost');

    const url = getCanisterURL(mockCanisterId);

    expect(url).toBe(`http://localhost:4943?canisterId=${mockCanisterId}`);
  });

  it('should handle different local host addresses', () => {
    mockGetDfxNetwork.mockReturnValue('local');
    mockGetLocalHostAddress.mockReturnValue('10.0.2.2');

    const url = getCanisterURL(mockCanisterId);

    expect(url).toBe(`http://10.0.2.2:4943?canisterId=${mockCanisterId}`);
  });
});
