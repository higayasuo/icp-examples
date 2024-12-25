import { ENV_VARS } from './env.generated';
import { getLocalCanisterURL } from './getLocalCanisterURL';
import { DfxNetwork } from './types';

/**
 * Constructs the URL for accessing a canister.
 * @param {string} canisterId - The ID of the canister.
 * @returns {string} - The URL to access the canister.
 */
export const getCanisterURL = (canisterId: string): string => {
  if (ENV_VARS.DFX_NETWORK === 'ic') {
    return `https://${canisterId}.ic0.app`;
  }

  return getLocalCanisterURL(canisterId);
};
