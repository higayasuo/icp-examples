import { Ed25519KeyIdentity } from '@dfinity/identity';
import { getStorage } from '../storage/platformStorage';

const APP_KEY_KEY = 'appKey';

/**
 * Sets up the application key used for identity management.
 * If a key exists in secure storage, retrieves and returns it.
 * Otherwise generates a new key, stores it securely, and returns it.
 * @returns Promise resolving to the Ed25519KeyIdentity for the app
 */
export const setupAppKey = async (): Promise<Ed25519KeyIdentity> => {
  const storage = await getStorage();
  const storedAppKey = await storage.getFromSecureStorage(APP_KEY_KEY);

  if (storedAppKey) {
    console.log('Restoring appKey');
    return Ed25519KeyIdentity.fromJSON(storedAppKey);
  } else {
    console.log('Generating new appKey');
    const appKey = Ed25519KeyIdentity.generate();
    await storage.saveToSecureStorage(
      APP_KEY_KEY,
      JSON.stringify(appKey.toJSON()),
    );
    return appKey;
  }
};

/**
 * Retrieves the application key from secure storage.
 * @throws {Error} If no app key is found in secure storage
 * @returns Promise resolving to the Ed25519KeyIdentity stored in secure storage
 */
export const retrieveAppKey = async (): Promise<Ed25519KeyIdentity> => {
  const storage = await getStorage();
  const storedAppKey = await storage.getFromSecureStorage(APP_KEY_KEY);

  if (storedAppKey) {
    return Ed25519KeyIdentity.fromJSON(storedAppKey);
  }

  throw new Error('No app key found');
};
