import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCanisterURL } from '../getCanisterURL';
import { ENV_VARS } from '../env.generated';
import { isLocalhostSubdomainSupported } from '../isLocalhostSubdomainSupported';

vi.mock('../env.generated', () => ({
  ENV_VARS: {
    DFX_NETWORK: 'local',
  },
}));

vi.mock('../isLocalhostSubdomainSupported', () => ({
  isLocalhostSubdomainSupported: vi.fn(),
}));

describe('getCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ic0.app URL when network is "ic"', () => {
    vi.mocked(ENV_VARS).DFX_NETWORK = 'ic';
    const url = getCanisterURL(mockCanisterId);
    expect(url).toBe(`https://${mockCanisterId}.ic0.app`);
  });

  describe('when network is not "ic"', () => {
    beforeEach(() => {
      vi.mocked(ENV_VARS).DFX_NETWORK = 'local';
    });

    it('should return localhost subdomain URL when subdomain is supported', () => {
      vi.mocked(isLocalhostSubdomainSupported).mockReturnValue(true);
      const url = getCanisterURL(mockCanisterId);
      expect(url).toBe(`http://${mockCanisterId}.localhost:4943`);
    });

    it('should return local IP URL when subdomain is not supported', () => {
      vi.mocked(isLocalhostSubdomainSupported).mockReturnValue(false);
      const url = getCanisterURL(mockCanisterId);
      expect(url).toBe(
        `https://192.168.0.210:14943/?canisterId=${mockCanisterId}`,
      );
    });
  });
});
