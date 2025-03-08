import { platformCrypto } from '@/crypto/platformCrypto';
import {
  ibeEncrypt,
  ibeDecrypt,
  TransportSecretKeyWrapper,
  createTransportSecretKey,
} from 'vetkeys-client-utils';
import { Principal } from '@dfinity/principal';
/**
 * AesOperations - Direct implementation of cryptographic operations
 * This class handles AES key management and encryption/decryption processes
 */
export class AesOperations {
  // Internal state
  private aesRawKey: Uint8Array | undefined = undefined;
  private tsk: TransportSecretKeyWrapper;
  public readonly transportPublicKey: Uint8Array;

  constructor() {
    const tskSeed = platformCrypto.getRandomBytes(32);
    this.tsk = createTransportSecretKey(tskSeed);
    this.transportPublicKey = this.tsk.getPublicKey();
  }

  /**
   * Decrypt an existing AES key
   * @param encryptedAesKey The encrypted AES key
   * @param encryptedKey The encrypted key for IBE decryption
   * @param publicKey The public key
   * @param principal The user's principal
   */
  async decryptExistingAesKey(
    encryptedAesKey: Uint8Array,
    encryptedKey: Uint8Array,
    publicKey: Uint8Array,
    principal: Principal,
  ): Promise<void> {
    try {
      const startTime = performance.now();

      const decryptedKey = await ibeDecrypt({
        ciphertext: encryptedAesKey,
        principal,
        encryptedKey,
        publicKey,
        tsk: this.tsk,
      });

      const endTime = performance.now();
      console.log(
        `AesOperations: AES Key decryption completed in ${
          endTime - startTime
        }ms`,
      );

      this.aesRawKey = decryptedKey;
    } catch (error) {
      console.error('AesOperations: Failed to decrypt AES key:', error);
      throw error;
    }
  }

  /**
   * Generates a new 32-byte AES key using cryptographically secure random bytes
   * and stores it in memory
   */
  async generateAesKey(): Promise<void> {
    this.aesRawKey = platformCrypto.getRandomBytes(32);
  }

  /**
   * Generate a new AES key and encrypt it if needed
   * @param publicKey The public key
   * @param principal The user's principal
   * @returns The encrypted AES key if user is not anonymous, undefined otherwise
   */
  async generateAndEncryptAesKey(
    publicKey: Uint8Array,
    principal: Principal,
  ): Promise<Uint8Array> {
    if (principal.isAnonymous()) {
      throw new Error('Anonymous users cannot generate and encrypt AES keys');
    }

    this.generateAesKey();

    return await this.encryptAesKey(publicKey, principal);
  }

  /**
   * Encrypt an AES key using IBE
   * @param publicKey The public key
   * @param principal The user's principal
   * @returns The encrypted AES key
   */
  private async encryptAesKey(
    publicKey: Uint8Array,
    principal: Principal,
  ): Promise<Uint8Array> {
    try {
      // Start IBE encryption process
      const startTime = performance.now();

      // Generate random seed for IBE encryption
      const seed = platformCrypto.getRandomBytes(32);
      // Execute encryption
      const encryptedBytes = await ibeEncrypt({
        data: this.aesRawKey!,
        principal,
        publicKey,
        seed,
      });

      const endTime = performance.now();
      console.log(
        `AesOperations: AES Key encryption completed in ${
          endTime - startTime
        }ms`,
      );

      // Return encrypted AES key
      return encryptedBytes;
    } catch (error) {
      console.error('AesOperations: Error encrypting AES key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using AES
   * @param params Parameters for encryption
   * @returns Encrypted data
   */
  async aesEncrypt(params: { plaintext: Uint8Array }): Promise<Uint8Array> {
    if (!this.aesRawKey) {
      throw new Error('No AES key available. Generate a key first.');
    }
    return await platformCrypto.aesEncryptAsync(
      params.plaintext,
      this.aesRawKey,
    );
  }

  /**
   * Decrypt data using AES
   * @param params Parameters for decryption
   * @returns Decrypted data
   */
  async aesDecrypt(params: { ciphertext: Uint8Array }): Promise<Uint8Array> {
    if (!this.aesRawKey) {
      throw new Error('No AES key available. Generate a key first.');
    }
    return await platformCrypto.aesDecryptAsync(
      params.ciphertext,
      this.aesRawKey,
    );
  }

  /**
   * Clear AES key
   */
  clearAesRawKey(): void {
    this.aesRawKey = undefined;
  }

  /**
   * Check if AES key exists
   * @returns True if AES key exists, false otherwise
   */
  get hasAesKey(): boolean {
    return this.aesRawKey !== undefined;
  }
}
