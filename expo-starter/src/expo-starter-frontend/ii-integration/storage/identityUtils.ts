import { DelegationChain, DelegationIdentity } from '@dfinity/identity';
import { getAppKey } from './appKeyUtils';

/**
 * Creates a DelegationIdentity from a DelegationChain using the app's key
 * @param chain - The delegation chain to create the identity from
 * @returns Promise resolving to a DelegationIdentity that can be used to make authenticated calls
 */
export const identityFromDelegation = async (
  chain: DelegationChain,
): Promise<DelegationIdentity> => {
  const appKey = await getAppKey();
  return DelegationIdentity.fromDelegation(appKey, chain);
};
