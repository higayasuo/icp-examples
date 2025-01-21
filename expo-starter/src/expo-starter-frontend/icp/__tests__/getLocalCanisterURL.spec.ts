import { describe, it, expect, vi } from 'vitest';
import { getCanisterLocalhostSubdomainURL } from '../getCanisterLocalhostSubdomainURL';
import { isLocalhostSubdomainSupported } from '../isLocalhostSubdomainSupported';

vi.mock('../isSubdomainSupported', () => ({
  isSubdomainSupported: vi.fn(),
}));

describe('getLocalCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  it('should return localhost URL when subdomain is supported', () => {
    vi.mocked(isLocalhostSubdomainSupported).mockReturnValue(true);
    const url = getCanisterLocalhostSubdomainURL(mockCanisterId);
    expect(url).toBe(`http://${mockCanisterId}.localhost:4943`);
  });

  it('should return ngrok URL when subdomain is not supported', () => {
    vi.mocked(isLocalhostSubdomainSupported).mockReturnValue(false);
    const url = getCanisterLocalhostSubdomainURL(mockCanisterId);
    expect(url).toMatch(
      new RegExp(
        `^https://.*\\.ngrok-free\\.app\\?canisterId=${mockCanisterId}$`,
      ),
    );
  });
});
