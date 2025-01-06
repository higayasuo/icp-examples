import { describe, it, expect } from 'vitest';
import { getLocalCanisterURL } from '../getLocalCanisterURL';

describe('getLocalCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  it('should return URL with canisterId as query parameter', () => {
    const url = getLocalCanisterURL(mockCanisterId);
    expect(url).toMatch(
      new RegExp(
        `^https://.*\\.ngrok-free\\.app\\?canisterId=${mockCanisterId}$`,
      ),
    );
  });
});
