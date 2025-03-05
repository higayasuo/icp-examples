import { DelegationChain, isDelegationValid } from '@dfinity/identity';
import { getStorage } from '../storage/platformStorage';

const DELEGATION_KEY = 'delegation';

/**
 * Retrieves a valid delegation chain from storage.
 * @returns Promise resolving to the stored DelegationChain if it exists and is valid, undefined otherwise
 */
export const retrieveValidDelegation = async (): Promise<
  DelegationChain | undefined
> => {
  const storage = await getStorage();
  const storedDelegation = await storage.getFromStorage(DELEGATION_KEY);

  if (storedDelegation) {
    const delegation = DelegationChain.fromJSON(storedDelegation);

    if (isDelegationValid(delegation)) {
      return delegation;
    } else {
      console.log('Invalid delegation chain, removing delegation');
      await storage.removeFromStorage(DELEGATION_KEY);
    }
  }

  return undefined;
};

/**
 * Saves a delegation chain to storage and returns it as a DelegationChain object
 * @param delegation - JSON string representation of a delegation chain
 * @returns Promise resolving to the parsed DelegationChain
 */
export const saveDelegation = async (
  delegation: string,
): Promise<DelegationChain> => {
  const storage = await getStorage();
  await storage.saveToStorage(DELEGATION_KEY, delegation);
  return DelegationChain.fromJSON(delegation);
};
