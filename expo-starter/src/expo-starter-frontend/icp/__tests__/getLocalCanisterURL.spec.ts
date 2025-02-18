import { describe, it, expect } from 'vitest';
import { getCanisterLocalhostSubdomainURL } from '../getCanisterLocalhostSubdomainURL';

describe('getLocalCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  it('should return localhost URL with correct format', () => {
    const url = getCanisterLocalhostSubdomainURL(mockCanisterId);
    expect(url).toBe(`http://${mockCanisterId}.localhost:4943`);
  });
});
