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
}
