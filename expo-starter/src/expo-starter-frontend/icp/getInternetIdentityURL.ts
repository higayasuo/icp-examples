import { ENV_VARS } from './env.generated';
import { getLocalCanisterSubdomainURL } from './getLocalCanisterSubdomainURL';
import { isSubdomainSupported } from './isSubdomainSupported';

const BASE_URL = 'https://192.168.0.44:24943/';

/**
 * Get the Internet Identity URL based on the current environment.
 *
 * @returns {string} The Internet Identity URL.
 */
export const getInternetIdentityURL = (): string => {
  if (ENV_VARS.DFX_NETWORK === 'ic') {
    return 'https://identity.ic0.app';
  }

  const canisterId = ENV_VARS.CANISTER_ID_INTERNET_IDENTITY;

  if (isSubdomainSupported()) {
    return getLocalCanisterSubdomainURL(canisterId);
  }

  return `${BASE_URL}?canisterId=${canisterId}`;
};
