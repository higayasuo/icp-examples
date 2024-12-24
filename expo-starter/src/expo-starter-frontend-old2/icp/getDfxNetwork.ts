import { DfxNetwork } from './types';

/**
 * Determines the DFX network environment.
 * @returns {DfxNetwork} - Returns 'local' if the environment is local, otherwise 'ic'.
 */
export const getDfxNetwork = (): DfxNetwork => {
  const network = process.env.NEXT_PUBLIC_DFX_NETWORK;
  // Use type guard to check if the network is a valid DfxNetwork
  if (isDfxNetwork(network)) {
    return network;
  }
  return 'local';
};

/**
 * Type guard function to check if a given value is of type DfxNetwork.
 * @param {string | undefined} value - The value to check.
 * @returns {value is DfxNetwork} - Returns true if the value is a DfxNetwork, false otherwise.
 */
function isDfxNetwork(value: string | undefined): value is DfxNetwork {
  return value === 'local' || value === 'ic' || value === 'playground';
}
