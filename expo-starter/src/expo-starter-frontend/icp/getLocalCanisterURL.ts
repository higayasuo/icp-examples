//import { isSubdomainSupported } from './isSubdomainSupported';
//import { getLocalHostAddress } from './getLocalHostAddress';

//const PORT = 4943;

const NGROK_URL = 'https://494a-175-111-121-27.ngrok-free.app';

/**
 * Generates a URL for a local canister based on the given canister ID.
 *
 * This function constructs a URL that can be used to access a canister running locally.
 * It checks if subdomains are supported in the current environment. If they are, it generates
 * a URL with the canister ID as a subdomain. Otherwise, it uses an ngrok URL with the canister ID
 * as a query parameter.
 *
 * @param {string} canisterId - The ID of the canister.
 * @returns {string} - The URL for the local canister.
 */
export const getLocalCanisterURL = (canisterId: string): string => {
  // if (isSubdomainSupported()) {
  //   return `http://${canisterId}.localhost:${PORT}`;
  // }

  return `${NGROK_URL}?canisterId=${canisterId}`;
};
