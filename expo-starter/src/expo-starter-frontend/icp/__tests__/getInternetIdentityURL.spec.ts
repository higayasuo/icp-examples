import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInternetIdentityURL } from '../getInternetIdentityURL';
import { ENV_VARS } from '../env.generated';

// Mock dependencies
const mockGetLocalCanisterURL = vi.fn();

vi.mock('../getLocalCanisterURL', () => ({
  getLocalCanisterURL: (canisterId: string) =>
    mockGetLocalCanisterURL(canisterId),
}));

vi.mock('../env.generated', () => ({
  ENV_VARS: {
    DFX_NETWORK: 'local',
    INTERNET_IDENTITY_CANISTER_ID: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
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
      expect(mockGetLocalCanisterURL).not.toHaveBeenCalled();
    });
  });

  describe('when DFX_NETWORK is not "ic"', () => {
    beforeEach(() => {
      vi.mocked(ENV_VARS).DFX_NETWORK = 'local';
      mockGetLocalCanisterURL.mockReturnValue(
        'http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai',
      );
    });

    it('should return local Internet Identity URL', () => {
      const url = getInternetIdentityURL();
      expect(url).toBe(
        'http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai',
      );
      expect(mockGetLocalCanisterURL).toHaveBeenCalledWith(
        'rdmx6-jaaaa-aaaaa-aaadq-cai',
      );
      expect(mockGetLocalCanisterURL).toHaveBeenCalledTimes(1);
    });
  });
});
