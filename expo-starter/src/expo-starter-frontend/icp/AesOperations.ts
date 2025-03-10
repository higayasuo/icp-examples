import { platformCrypto, type CryptoModule } from 'expo-crypto-universal';
import {
  ibeEncrypt,
  ibeDecrypt,
  TransportSecretKey,
} from 'vetkeys-client-utils';

/**
 * Parameters for decrypting an existing AES key
 */
export interface DecryptExistingAesKeyParams {
  /** The encrypted AES key */
  encryptedAesKey: Uint8Array;
  /** The encrypted key for IBE decryption */
  encryptedKey: Uint8Array;
  /** The public key */
  publicKey: Uint8Array;
  /** The user's principal as Uint8Array */
  principal: Uint8Array;
}

/**
 * AesOperations - Direct implementation of cryptographic operations
 * This class handles AES key management and encryption/decryption processes
 */
export class AesOperations {
  private aesRawKey: Uint8Array | undefined = undefined;
  private tsk: TransportSecretKey;
  public readonly transportPublicKey: Uint8Array;

  constructor() {
    const tskSeed = platformCrypto.getRandomBytes(32);
    this.tsk = new TransportSecretKey(tskSeed);
    this.transportPublicKey = this.tsk.public_key();
  }

  /**
   * Decrypt an existing AES key
   * @param params The parameters for decrypting the AES key
   */
  async decryptExistingAesKey(
    params: DecryptExistingAesKeyParams,
  ): Promise<void> {
    try {
      const startTime = performance.now();

      const decryptedKey = await ibeDecrypt({
        ciphertext: params.encryptedAesKey,
        principal: params.principal,
        encryptedKey: params.encryptedKey,
        publicKey: params.publicKey,
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
    this.aesRawKey = platformCrypto!.getRandomBytes(32);
  }

  /**
   * Generate a new AES key and encrypt it if needed
   * @param publicKey The public key
   * @param principal The user's principal as Uint8Array
   * @returns The encrypted AES key
   */
  async generateAndEncryptAesKey(
    publicKey: Uint8Array,
    principal: Uint8Array,
  ): Promise<Uint8Array> {
    await this.generateAesKey();
    return await this.encryptAesKey(publicKey, principal);
  }

  /**
   * Encrypt an AES key using IBE
   * @param publicKey The public key
   * @param principal The user's principal as Uint8Array
   * @returns The encrypted AES key
   */
  private async encryptAesKey(
    publicKey: Uint8Array,
    principal: Uint8Array,
  ): Promise<Uint8Array> {
    if (!this.aesRawKey) {
      throw new Error('No AES key available.');
    }

    try {
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
      throw new Error('No AES key available.');
    }

    return await platformCrypto.aesEncryptAsync(
      params.plaintext,
      this.aesRawKey!,
    );
  }

  /**
   * Decrypt data using AES
   * @param params Parameters for decryption
   * @returns Decrypted data
   */
  async aesDecrypt(params: { ciphertext: Uint8Array }): Promise<Uint8Array> {
    if (!this.aesRawKey) {
      throw new Error('No AES key available.');
    }

    return await platformCrypto.aesDecryptAsync(
      params.ciphertext,
      this.aesRawKey!,
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
