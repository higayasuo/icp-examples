import { describe, it, expect, vi } from 'vitest';
import { principalFromAgent } from '../principalFromAgent';
import { Principal } from '@dfinity/principal';
import { Agent } from '@dfinity/agent';

describe('principalFromAgent', () => {
  it('should return anonymous principal when agent is undefined', async () => {
    const principal = await principalFromAgent(undefined);
    expect(principal.isAnonymous()).toBe(true);
  });

  it('should return principal from agent when agent is provided', async () => {
    const mockPrincipal = Principal.fromText('2vxsx-fae');
    const mockAgent = {
      getPrincipal: vi.fn().mockResolvedValue(mockPrincipal),
    } as unknown as Agent;

    const principal = await principalFromAgent(mockAgent);
    expect(principal).toBe(mockPrincipal);
    expect(mockAgent.getPrincipal).toHaveBeenCalledTimes(1);
  });
});
