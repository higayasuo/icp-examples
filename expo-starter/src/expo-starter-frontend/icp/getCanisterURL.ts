import { ENV_VARS } from './env.generated';
import { getLocalCanisterSubdomainURL } from './getLocalCanisterSubdomainURL';
import { isSubdomainSupported } from './isSubdomainSupported';

const BASE_URL = 'https://192.168.0.210:14943/';
/**
 * Constructs the URL for accessing a canister.
 * @param {string} canisterId - The ID of the canister.
 * @returns {string} - The URL to access the canister.
 */
export const getCanisterURL = (canisterId: string): string => {
  if (ENV_VARS.DFX_NETWORK === 'ic') {
    return `https://${canisterId}.ic0.app`;
  }

  if (isSubdomainSupported()) {
    return getLocalCanisterSubdomainURL(canisterId);
  }

  return `${BASE_URL}?canisterId=${canisterId}`;
};
