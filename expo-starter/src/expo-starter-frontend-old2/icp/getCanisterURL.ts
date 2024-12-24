import { getDfxNetwork } from './getDfxNetwork';
import { getLocalCanisterURL } from './getLocalCanisterURL';

/**
 * Constructs the URL for accessing a canister.
 * @param {string} canisterId - The ID of the canister.
 * @returns {string} - The URL to access the canister.
 */
export const getCanisterURL = (canisterId: string): string => {
  if (getDfxNetwork() === 'ic') {
    return `https://${canisterId}.ic0.app`;
  }

  return getLocalCanisterURL(canisterId);
};
