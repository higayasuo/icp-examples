/**
 * Interface for crypto operations that can be implemented by different platforms
 */
export interface CryptoModule {
  /**
   * Generates random bytes of specified size
   * @param size - The number of random bytes to generate
   * @returns Uint8Array containing random bytes
   */
  getRandomBytes(size: number): Uint8Array;

  /**
   * Computes SHA-256 hash of the input string and returns it as base64 encoded string
   * @param code - The input string to hash
   * @returns Promise resolving to base64 encoded SHA-256 hash
   */
  sha256Async(code: string): Promise<string>;

  /**
   * Encrypts data using AES-GCM
   * @param data - The data to encrypt as bytes
   * @param rawKey - The encryption key as bytes
   * @returns Promise resolving to encrypted bytes with IV prepended
   */
  aesEncryptAsync(data: Uint8Array, rawKey: Uint8Array): Promise<Uint8Array>;

  /**
   * Decrypts AES-GCM encrypted data
   * @param data - The encrypted data as bytes (including IV)
   * @param rawKey - The decryption key as bytes
   * @returns Promise resolving to decrypted bytes
   */
  aesDecryptAsync(data: Uint8Array, rawKey: Uint8Array): Promise<Uint8Array>;
}
