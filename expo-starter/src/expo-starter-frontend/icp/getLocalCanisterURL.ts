import { isSubdomainSupported } from './isSubdomainSupported';
import { getLocalHostAddress } from './getLocalHostAddress';

const PORT = 4943;

/**
 * Constructs the URL for accessing a canister in a local development environment.
 *
 * This function determines the appropriate URL format based on whether subdomain URLs are supported.
 * If subdomains are supported, it constructs a URL with the canister ID as a subdomain.
 * Otherwise, it uses the local host address and includes the canister ID as a query parameter.
 *
 * @param {string} canisterId - The ID of the canister to generate a URL for.
 * @returns {string} - The local URL for accessing the canister.
 */
export const getLocalCanisterURL = (canisterId: string): string => {
  if (isSubdomainSupported()) {
    return `http://${canisterId}.localhost:${PORT}`;
  }

  return `http://${getLocalHostAddress()}:${PORT}?canisterId=${canisterId}`;
};
