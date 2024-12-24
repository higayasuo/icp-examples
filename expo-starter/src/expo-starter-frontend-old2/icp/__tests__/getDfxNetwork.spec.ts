import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDfxNetwork } from '../getDfxNetwork';
import { DfxNetwork } from '../types';

describe('getDfxNetwork', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should return "local" when NEXT_PUBLIC_DFX_NETWORK is not set', () => {
    delete process.env.NEXT_PUBLIC_DFX_NETWORK;
    expect(getDfxNetwork()).toBe<DfxNetwork>('local');
  });

  it('should return "local" when NEXT_PUBLIC_DFX_NETWORK is set to "local"', () => {
    process.env.NEXT_PUBLIC_DFX_NETWORK = 'local';
    expect(getDfxNetwork()).toBe<DfxNetwork>('local');
  });

  it('should return "ic" when NEXT_PUBLIC_DFX_NETWORK is set to "ic"', () => {
    process.env.NEXT_PUBLIC_DFX_NETWORK = 'ic';
    expect(getDfxNetwork()).toBe<DfxNetwork>('ic');
  });

  it('should return "playground" when NEXT_PUBLIC_DFX_NETWORK is set to "playground"', () => {
    process.env.NEXT_PUBLIC_DFX_NETWORK = 'playground';
    expect(getDfxNetwork()).toBe<DfxNetwork>('playground');
  });

  it('should return "local" when NEXT_PUBLIC_DFX_NETWORK is set to an invalid value', () => {
    process.env.NEXT_PUBLIC_DFX_NETWORK = 'invalid';
    expect(getDfxNetwork()).toBe<DfxNetwork>('local');
  });
});
