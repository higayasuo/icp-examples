import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Actor, HttpAgent, ActorSubclass, Identity } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { createActor } from '../createActor';
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

vi.mock('../getCanisterURL', () => ({
  getCanisterURL: vi.fn(),
}));

vi.mock('@dfinity/agent', () => ({
  Actor: {
    createActor: vi.fn(),
  },
  HttpAgent: {
    createSync: vi.fn(),
  },
}));

describe('createActor', () => {
  const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
  const mockInterfaceFactory = {} as IDL.InterfaceFactory;
  const mockIdentity = {} as Identity;
  const mockAgent = {
    fetchRootKey: vi.fn().mockResolvedValue(new Uint8Array()),
    rootKey: new Uint8Array(),
    host: '',
    _isAgent: true,
    getPrincipal: vi.fn(),
    call: vi.fn(),
    query: vi.fn(),
    readState: vi.fn(),
    status: vi.fn(),
    invalidateIdentity: vi.fn(),
    replaceIdentity: vi.fn(),
  } as unknown as HttpAgent;
  const mockActor = {} as ActorSubclass<unknown>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.mocked(HttpAgent.createSync).mockReturnValue(mockAgent);
    vi.mocked(Actor.createActor).mockReturnValue(mockActor);
  });

  it('should create actor with local host when network is local', () => {
    mockEnvVars.DFX_NETWORK = 'local';
    vi.mocked(getCanisterURL).mockReturnValue('http://127.0.0.1:4943');

    const result = createActor({
      canisterId: mockCanisterId,
      interfaceFactory: mockInterfaceFactory,
      identity: mockIdentity,
    });

    expect(HttpAgent.createSync).toHaveBeenCalledWith({
      host: 'http://127.0.0.1:4943',
      identity: mockIdentity,
    });
    expect(mockAgent.fetchRootKey).toHaveBeenCalled();
    expect(Actor.createActor).toHaveBeenCalledWith(mockInterfaceFactory, {
      agent: mockAgent,
      canisterId: mockCanisterId,
    });
    expect(result).toBe(mockActor);
  });

  it('should create actor with ic host when network is ic', () => {
    mockEnvVars.DFX_NETWORK = 'ic';
    vi.mocked(getCanisterURL).mockReturnValue(
      `https://${mockCanisterId}.ic0.app`,
    );

    const result = createActor({
      canisterId: mockCanisterId,
      interfaceFactory: mockInterfaceFactory,
      identity: mockIdentity,
    });

    expect(HttpAgent.createSync).toHaveBeenCalledWith({
      host: `https://${mockCanisterId}.ic0.app`,
      identity: mockIdentity,
    });
    expect(mockAgent.fetchRootKey).not.toHaveBeenCalled();
    expect(Actor.createActor).toHaveBeenCalledWith(mockInterfaceFactory, {
      agent: mockAgent,
      canisterId: mockCanisterId,
    });
    expect(result).toBe(mockActor);
  });

  it('should handle fetchRootKey error in local network', async () => {
    mockEnvVars.DFX_NETWORK = 'local';
    vi.mocked(getCanisterURL).mockReturnValue('http://127.0.0.1:4943');

    const mockError = new Error('Fetch root key error');
    const mockAgentWithError = {
      ...mockAgent,
      fetchRootKey: vi.fn().mockRejectedValue(mockError),
    } as unknown as HttpAgent;
    vi.mocked(HttpAgent.createSync).mockReturnValue(mockAgentWithError);

    const consoleSpy = vi.spyOn(console, 'error');
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    const result = createActor({
      canisterId: mockCanisterId,
      interfaceFactory: mockInterfaceFactory,
      identity: mockIdentity,
    });

    // Wait for the promise rejection to be handled
    await new Promise(process.nextTick);

    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Your local replica is not running',
    );
    expect(result).toBe(mockActor);
  });
});
