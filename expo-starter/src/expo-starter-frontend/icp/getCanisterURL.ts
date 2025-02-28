import { ENV_VARS } from './env.generated';
import { HOST_ADDRESS } from './constants';

const REPLICA_PORT = 4943;
/**
 * Constructs the URL for accessing a canister.
 * @param {string} canisterId - The ID of the canister.
 * @returns {string} - The URL to access the canister.
 */
export const getCanisterURL = (canisterId: string): string => {
  if (ENV_VARS.DFX_NETWORK !== 'local') {
    const url = `https://${canisterId}.ic0.app`;
    return url;
  }

  if (window?.location?.origin?.includes('localhost')) {
    return `http://localhost:${REPLICA_PORT}/?canisterId=${canisterId}`;
  }

  return `https://${HOST_ADDRESS}:14943/?canisterId=${canisterId}`;
};
