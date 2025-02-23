import { ENV_VARS } from './env.generated';
import { getCanisterLocalhostSubdomainURL } from './getCanisterLocalhostSubdomainURL';
import { isLocalhostSubdomainSupported } from './isLocalhostSubdomainSupported';
import { HOST_ADDRESS } from './constants';

/**
 * Get the Internet Identity URL based on the current environment.
 *
 * @returns {string} The Internet Identity URL.
 */
export const getInternetIdentityURL = (): string => {
  if (ENV_VARS.DFX_NETWORK !== 'ic') {
    return 'https://identity.ic0.app';
  }

  const canisterId = ENV_VARS.CANISTER_ID_INTERNET_IDENTITY;

  if (isLocalhostSubdomainSupported()) {
    return getCanisterLocalhostSubdomainURL(canisterId);
  }

  return `https://${HOST_ADDRESS}:24943/?canisterId=${canisterId}`;
};
