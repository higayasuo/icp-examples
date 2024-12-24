import { getLocalHostAddress } from './getLocalHostAddress';

const PORT = 4943;

/**
 * Constructs the local URL for accessing a canister.
 * @param {string} canisterId - The ID of the canister.
 * @returns {string} - The local URL to access the canister.
 */
export const getLocalCanisterURL = (canisterId: string): string => {
  return `http://${getLocalHostAddress()}:${PORT}?canisterId=${canisterId}`;
};
