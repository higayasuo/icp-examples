import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInternetIdentityURL } from '../getInternetIdentityURL';
import { ENV_VARS } from '../env.generated';
import { isLocalhostSubdomainSupported } from '../isLocalhostSubdomainSupported';

// Mock dependencies
const mockGetLocalCanisterURL = vi.fn();

vi.mock('../getLocalCanisterURL', () => ({
  getLocalCanisterURL: (canisterId: string) =>
    mockGetLocalCanisterURL(canisterId),
}));

vi.mock('../isLocalhostSubdomainSupported', () => ({
  isLocalhostSubdomainSupported: vi.fn(),
}));

vi.mock('../env.generated', () => ({
  ENV_VARS: {
    DFX_NETWORK: 'local',
    CANISTER_ID_INTERNET_IDENTITY: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
  },
}));

describe('getInternetIdentityURL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when DFX_NETWORK is "ic"', () => {
    beforeEach(() => {
      vi.mocked(ENV_VARS).DFX_NETWORK = 'ic';
    });

    it('should return production Internet Identity URL', () => {
      const url = getInternetIdentityURL();
      expect(url).toBe('https://identity.ic0.app');
    });
  });

  describe('when DFX_NETWORK is not "ic"', () => {
    beforeEach(() => {
      vi.mocked(ENV_VARS).DFX_NETWORK = 'local';
    });

    it('should return local Internet Identity URL with subdomain when supported', () => {
      vi.mocked(isLocalhostSubdomainSupported).mockReturnValue(true);
      const url = getInternetIdentityURL();
      expect(url).toBe(
        `http://${ENV_VARS.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`,
      );
    });

    it('should return local Internet Identity URL with IP when subdomain not supported', () => {
      vi.mocked(isLocalhostSubdomainSupported).mockReturnValue(false);
      const url = getInternetIdentityURL();
      expect(url).toBe(
        `https://192.168.0.210:24943/?canisterId=${ENV_VARS.CANISTER_ID_INTERNET_IDENTITY}`,
      );
    });
  });
});
