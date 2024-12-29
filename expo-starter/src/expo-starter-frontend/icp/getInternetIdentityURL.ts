import { ENV_VARS } from './env.generated';
import { getLocalCanisterURL } from './getLocalCanisterURL';

/**
 * Constructs the URL for accessing the Internet Identity service.
 *
 * This function determines the appropriate URL based on the current DFX network.
 * If the network is 'ic', it returns the production URL for the Internet Identity service.
 * Otherwise, it constructs a local URL using the Internet Identity canister ID.
 *
 * @returns {string} - The URL for accessing the Internet Identity service.
 */
export const getInternetIdentityURL = (): string => {
  if (ENV_VARS.DFX_NETWORK === 'ic') {
    return `https://identity.ic0.app`;
  }

  return `${getLocalCanisterURL(ENV_VARS.INTERNET_IDENTITY_CANISTER_ID)}`;
};
