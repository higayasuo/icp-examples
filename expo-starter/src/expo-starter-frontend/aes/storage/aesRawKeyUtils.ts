import * as base64 from 'base64-js';
import { platformStorage } from 'expo-storage-universal';
import { platformCrypto } from 'expo-crypto-universal';

const AES_RAW_KEY_KEY = 'fooBarHello';

/**
 * Generates a new AES raw key and saves it to secure storage.
 * @returns {Promise<Uint8Array>} A promise that resolves to the generated AES raw key.
 */
export const generateAesRawKey = async (): Promise<Uint8Array> => {
  const aesRawKey = platformCrypto.getRandomBytes(32);
  await platformStorage.saveToSecureStorage(
    AES_RAW_KEY_KEY,
    base64.fromByteArray(aesRawKey),
  );
  return aesRawKey;
};

/**
 * Gets the AES raw key from secure storage.
 * @throws {Error} If no AES raw key is found in secure storage.
 * @returns {Promise<Uint8Array>} A promise that resolves to the retrieved AES raw key.
 */
export const getAesRawKey = async (): Promise<Uint8Array> => {
  const storedAesRawKey = await platformStorage.getFromSecureStorage(
    AES_RAW_KEY_KEY,
  );

  if (!storedAesRawKey) {
    throw new Error('No AES raw key found');
  }

  return base64.toByteArray(storedAesRawKey);
};

/**
 * Sets up the AES raw key by retrieving it from secure storage or generating a new one if it doesn't exist.
 * @returns {Promise<Uint8Array>} A promise that resolves to the AES raw key.
 */
export const setupAesRawKey = async (): Promise<Uint8Array> => {
  const storedAesRawKey = await platformStorage.getFromSecureStorage(
    AES_RAW_KEY_KEY,
  );

  if (storedAesRawKey) {
    return base64.toByteArray(storedAesRawKey);
  } else {
    return generateAesRawKey();
  }
};
/**
 * Saves the provided AES raw key to secure storage.
 * @param {Uint8Array} aesRawKey - The AES raw key to save.
 * @returns {Promise<void>} A promise that resolves when the key has been saved.
 */
export const saveAesRawKey = async (aesRawKey: Uint8Array): Promise<void> => {
  await platformStorage.saveToSecureStorage(
    AES_RAW_KEY_KEY,
    base64.fromByteArray(aesRawKey),
  );
};

/**
 * Removes the AES raw key from secure storage.
 * @returns {Promise<void>} A promise that resolves when the key has been removed.
 */
export const removeAesRawKey = async (): Promise<void> => {
  await platformStorage.removeFromSecureStorage(AES_RAW_KEY_KEY);
};
