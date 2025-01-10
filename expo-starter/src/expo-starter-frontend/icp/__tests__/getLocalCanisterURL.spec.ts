import { describe, it, expect, vi } from 'vitest';
import { getLocalCanisterSubdomainURL } from '../getLocalCanisterSubdomainURL';
import { isSubdomainSupported } from '../isSubdomainSupported';

vi.mock('../isSubdomainSupported', () => ({
  isSubdomainSupported: vi.fn(),
}));

describe('getLocalCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  it('should return localhost URL when subdomain is supported', () => {
    vi.mocked(isSubdomainSupported).mockReturnValue(true);
    const url = getLocalCanisterSubdomainURL(mockCanisterId);
    expect(url).toBe(`http://${mockCanisterId}.localhost:4943`);
  });

  it('should return ngrok URL when subdomain is not supported', () => {
    vi.mocked(isSubdomainSupported).mockReturnValue(false);
    const url = getLocalCanisterSubdomainURL(mockCanisterId);
    expect(url).toMatch(
      new RegExp(
        `^https://.*\\.ngrok-free\\.app\\?canisterId=${mockCanisterId}$`,
      ),
    );
  });
});
