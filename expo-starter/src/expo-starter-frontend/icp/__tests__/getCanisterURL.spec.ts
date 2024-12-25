import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCanisterURL } from '../getCanisterURL';

// Mock modules
const mockEnvVars = {
  DFX_NETWORK: 'local',
};

vi.mock('../env.generated', () => ({
  get ENV_VARS() {
    return mockEnvVars;
  },
}));

const mockGetLocalCanisterURL = vi.fn();
vi.mock('../getLocalCanisterURL', () => ({
  getLocalCanisterURL: () => mockGetLocalCanisterURL(),
}));

describe('getCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ic0.app URL when network is "ic"', () => {
    mockEnvVars.DFX_NETWORK = 'ic';

    const url = getCanisterURL(mockCanisterId);

    expect(url).toBe(`https://${mockCanisterId}.ic0.app`);
  });

  it('should return local canister URL for non-ic networks', () => {
    mockEnvVars.DFX_NETWORK = 'local';
    mockGetLocalCanisterURL.mockReturnValue(
      'http://127.0.0.1:4943?canisterId=rrkah-fqaaa-aaaaa-aaaaq-cai',
    );

    const url = getCanisterURL(mockCanisterId);

    expect(url).toBe(
      'http://127.0.0.1:4943?canisterId=rrkah-fqaaa-aaaaa-aaaaq-cai',
    );
  });
});
