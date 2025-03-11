import { Storage } from './Storage';

/**
 * WebStorage class implementing the Storage interface for web platforms.
 * Uses sessionStorage for regular and secure storage operations.
 */
export class WebStorage implements Storage {
  /**
   * Creates a new instance of WebStorage.
   */
  constructor() {}

  /**
   * Retrieves a value from regular storage.
   * @param {string} key - The key of the item to retrieve.
   * @returns {Promise<string | undefined>} - A promise that resolves to the retrieved value or undefined if not found.
   */
  async getFromStorage(key: string): Promise<string | undefined> {
    return sessionStorage.getItem(key) ?? undefined;
  }

  /**
   * Saves a value to regular storage.
   * @param {string} key - The key under which the value should be stored.
   * @param {string} value - The value to store.
   * @returns {Promise<void>} - A promise that resolves when the value has been saved.
   */
  async saveToStorage(key: string, value: string): Promise<void> {
    sessionStorage.setItem(key, value);
  }

  /**
   * Removes a value from regular storage.
   * @param {string} key - The key of the item to remove.
   * @returns {Promise<void>} - A promise that resolves when the value has been removed.
   */
  async removeFromStorage(key: string): Promise<void> {
    sessionStorage.removeItem(key);
  }

  /**
   * Retrieves a value from secure storage.
   * @param {string} key - The key of the item to retrieve.
   * @returns {Promise<string | undefined>} - A promise that resolves to the retrieved value or undefined if not found.
   */
  async getFromSecureStorage(key: string): Promise<string | undefined> {
    return sessionStorage.getItem(key) ?? undefined;
  }

  /**
   * Saves a value to secure storage.
   * @param {string} key - The key under which the value should be stored.
   * @param {string} value - The value to store.
   * @returns {Promise<void>} - A promise that resolves when the value has been saved.
   */
  async saveToSecureStorage(key: string, value: string): Promise<void> {
    sessionStorage.setItem(key, value);
  }

  /**
   * Removes a value from secure storage.
   * @param {string} key - The key of the item to remove.
   * @returns {Promise<void>} - A promise that resolves when the value has been removed.
   */
  async removeFromSecureStorage(key: string): Promise<void> {
    sessionStorage.removeItem(key);
  }
}
