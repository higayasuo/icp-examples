import { Ed25519KeyIdentity } from '@dfinity/identity';
import { platformStorage } from 'expo-storage-universal';

const APP_KEY_KEY = 'appKey';

/**
 * Generates a new application key and saves it to secure storage.
 * @returns {Promise<Ed25519KeyIdentity>} A promise that resolves to the generated Ed25519KeyIdentity.
 */
export const generateAppKey = async (): Promise<Ed25519KeyIdentity> => {
  console.log('Generating and saving new appKey');
  const appKey = Ed25519KeyIdentity.generate();
  await platformStorage.saveToSecureStorage(
    APP_KEY_KEY,
    JSON.stringify(appKey.toJSON()),
  );
  return appKey;
};

/**
 * Sets up the application key used for identity management.
 * If a key exists in secure storage, retrieves and returns it.
 * Otherwise generates a new key, stores it securely, and returns it.
 * @returns Promise resolving to the Ed25519KeyIdentity for the app
 */
export const setupAppKey = async (): Promise<Ed25519KeyIdentity> => {
  const appKey = await findAppKey();

  if (appKey) {
    console.log('Found appKey in secure storage');
    return appKey;
  } else {
    return generateAppKey();
  }
};

/**
 * Finds the application key in secure storage.
 * If the key exists, returns the Ed25519KeyIdentity.
 * If the key does not exist, returns undefined.
 * @returns Promise resolving to the Ed25519KeyIdentity or undefined if not found
 */
export const findAppKey = async (): Promise<Ed25519KeyIdentity | undefined> => {
  const storedAppKey = await platformStorage.getFromSecureStorage(APP_KEY_KEY);
  return storedAppKey ? Ed25519KeyIdentity.fromJSON(storedAppKey) : undefined;
};

/**
 * Gets the application key from secure storage.
 * @throws {Error} If no app key is found in secure storage
 * @returns Promise resolving to the Ed25519KeyIdentity stored in secure storage
 */
export const getAppKey = async (): Promise<Ed25519KeyIdentity> => {
  const storedAppKey = await platformStorage.getFromSecureStorage(APP_KEY_KEY);

  if (storedAppKey) {
    return Ed25519KeyIdentity.fromJSON(storedAppKey);
  }

  throw new Error('No app key found');
};
