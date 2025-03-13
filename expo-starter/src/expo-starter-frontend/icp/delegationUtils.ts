import { DelegationChain, isDelegationValid } from '@dfinity/identity';
import { platformStorage } from 'expo-storage-universal';

const DELEGATION_KEY = 'delegation';

/**
 * Finds a valid delegation chain in storage.
 * @returns {Promise<DelegationChain | undefined>} Promise resolving to the stored DelegationChain if it exists and is valid, undefined otherwise
 */
export const findValidDelegation = async (): Promise<
  DelegationChain | undefined
> => {
  const storedDelegation = await platformStorage.getFromStorage(DELEGATION_KEY);

  if (storedDelegation) {
    const delegation = DelegationChain.fromJSON(storedDelegation);

    if (isDelegationValid(delegation)) {
      return delegation;
    } else {
      console.log('Invalid delegation chain, removing delegation');
      await platformStorage.removeFromStorage(DELEGATION_KEY);
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
  await platformStorage.saveToStorage(DELEGATION_KEY, delegation);
  return DelegationChain.fromJSON(delegation);
};

/**
 * Removes the delegation chain from storage.
 * @returns {Promise<void>} A promise that resolves when the delegation has been removed.
 */
export const removeDelegation = async (): Promise<void> => {
  platformStorage.removeFromStorage(DELEGATION_KEY);
};
