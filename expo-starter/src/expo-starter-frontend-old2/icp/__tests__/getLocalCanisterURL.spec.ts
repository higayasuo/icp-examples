import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLocalCanisterURL } from '../getLocalCanisterURL';

// Mock getLocalHostAddress
const mockGetLocalHostAddress = vi.fn();

vi.mock('../getLocalHostAddress', () => ({
  getLocalHostAddress: () => mockGetLocalHostAddress(),
}));

describe('getLocalCanisterURL', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return URL with localhost when running on web', () => {
    mockGetLocalHostAddress.mockReturnValue('localhost');

    const url = getLocalCanisterURL(mockCanisterId);

    expect(url).toBe(`http://localhost:4943?canisterId=${mockCanisterId}`);
  });

  it('should return URL with 127.0.0.1 when running on iOS without hostUri', () => {
    mockGetLocalHostAddress.mockReturnValue('127.0.0.1');

    const url = getLocalCanisterURL(mockCanisterId);

    expect(url).toBe(`http://127.0.0.1:4943?canisterId=${mockCanisterId}`);
  });

  it('should return URL with 10.0.2.2 when running on Android', () => {
    mockGetLocalHostAddress.mockReturnValue('10.0.2.2');

    const url = getLocalCanisterURL(mockCanisterId);

    expect(url).toBe(`http://10.0.2.2:4943?canisterId=${mockCanisterId}`);
  });

  it('should return URL with IP address when running on iOS with hostUri', () => {
    mockGetLocalHostAddress.mockReturnValue('192.168.1.5');

    const url = getLocalCanisterURL(mockCanisterId);

    expect(url).toBe(`http://192.168.1.5:4943?canisterId=${mockCanisterId}`);
  });
});
