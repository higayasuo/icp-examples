import { ENV_VARS } from './env.generated';
import { getCanisterLocalhostSubdomainURL } from './getCanisterLocalhostSubdomainURL';
import { isLocalhostSubdomainSupported } from './isLocalhostSubdomainSupported';
import { HOST_ADDRESS } from './constants';

/**
 * Constructs the URL for accessing a canister.
 * @param {string} canisterId - The ID of the canister.
 * @returns {string} - The URL to access the canister.
 */
export const getCanisterURL = (canisterId: string): string => {
  if (ENV_VARS.DFX_NETWORK === 'ic') {
    return `https://${canisterId}.ic0.app`;
  }

  if (isLocalhostSubdomainSupported()) {
    return getCanisterLocalhostSubdomainURL(canisterId);
  }

  return `https://${HOST_ADDRESS}:14943/?canisterId=${canisterId}`;
};
