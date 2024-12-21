import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDfxNetwork, isLocal, createActor } from './actorUtils';
import { Actor, HttpAgent, ActorSubclass } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { getProfileName } from '../config';

vi.mock('../config', () => ({
  getProfileName: vi.fn(),
}));

vi.mock('@dfinity/agent', () => ({
  Actor: {
    createActor: vi.fn(),
  },
  HttpAgent: {
    createSync: vi.fn(),
  },
}));

describe('actorUtils', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_DFX_NETWORK = undefined;
    vi.mocked(getProfileName).mockReturnValue('production');
  });

  describe('getDfxNetwork', () => {
    it('should return local when NEXT_PUBLIC_DFX_NETWORK is set to local', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = 'local';
      expect(getDfxNetwork()).toBe('local');
    });

    it('should return local when profile name is development', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = undefined;
      vi.mocked(getProfileName).mockReturnValue('development');
      expect(getDfxNetwork()).toBe('local');
    });

    it('should return ic when neither condition is met', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = undefined;
      vi.mocked(getProfileName).mockReturnValue('production');
      expect(getDfxNetwork()).toBe('ic');
    });
  });

  describe('isLocal', () => {
    it('should return true when getDfxNetwork returns local', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = 'local';
      expect(isLocal()).toBe(true);
    });

    it('should return false when getDfxNetwork returns ic', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = undefined;
      vi.mocked(getProfileName).mockReturnValue('production');
      expect(isLocal()).toBe(false);
    });
  });

  describe('createActor', () => {
    const mockCanisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
    const mockInterfaceFactory = {} as IDL.InterfaceFactory;
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
      vi.mocked(HttpAgent.createSync).mockReturnValue(mockAgent);
      vi.mocked(Actor.createActor).mockReturnValue(mockActor);
      vi.clearAllMocks();
    });

    it('should create actor with local host when environment is local', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = 'local';

      createActor(mockCanisterId, mockInterfaceFactory);

      expect(HttpAgent.createSync).toHaveBeenCalledWith({
        host: 'http://127.0.0.1:4943',
      });
      expect(Actor.createActor).toHaveBeenCalledWith(mockInterfaceFactory, {
        agent: mockAgent,
        canisterId: mockCanisterId,
      });
    });

    it('should create actor with ic host when environment is ic', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = undefined;
      vi.mocked(getProfileName).mockReturnValue('production');

      createActor(mockCanisterId, mockInterfaceFactory);

      expect(HttpAgent.createSync).toHaveBeenCalledWith({
        host: `https://${mockCanisterId}.ic0.app`,
      });
      expect(Actor.createActor).toHaveBeenCalledWith(mockInterfaceFactory, {
        agent: mockAgent,
        canisterId: mockCanisterId,
      });
    });

    it('should fetch root key when environment is local', async () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = 'local';

      createActor(mockCanisterId, mockInterfaceFactory);

      expect(mockAgent.fetchRootKey).toHaveBeenCalled();
    });

    it('should not fetch root key when environment is ic', () => {
      process.env.NEXT_PUBLIC_DFX_NETWORK = undefined;
      vi.mocked(getProfileName).mockReturnValue('production');

      createActor(mockCanisterId, mockInterfaceFactory);

      expect(mockAgent.fetchRootKey).not.toHaveBeenCalled();
    });
  });
});
