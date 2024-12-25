import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthClient } from '@dfinity/auth-client';
import { getAuthClient } from '../getAuthClient';

vi.mock('@dfinity/auth-client');

describe('getAuthClient', () => {
  const mockAuthClient = {} as AuthClient;

  beforeEach(() => {
    vi.mocked(AuthClient.create).mockResolvedValue(mockAuthClient);
  });

  it('should return the same AuthClient instance for multiple calls', async () => {
    const client = await getAuthClient();

    expect(client).toBe(mockAuthClient);
    expect(client).toBe(await getAuthClient());
    expect(AuthClient.create).toHaveBeenCalledTimes(1);
  });
});
