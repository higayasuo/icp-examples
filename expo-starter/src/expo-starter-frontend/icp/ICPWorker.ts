import { platformCrypto } from '@/crypto/platformCrypto';
import { ibeEncrypt } from './ibeEncrypt';
import { ibeDecrypt } from './ibeDecrypt';
import { Principal } from '@dfinity/principal';
import { _SERVICE } from './expo-starter-backend.did';
import {
  TransportSecretKeyWrapper,
  createTransportSecretKey,
} from './TransportSecretKeyWrapper';
import { createBackend } from './backend';

/**
 * Message type literals
 */
export const MessageType = {
  INITIALIZE_AES_KEY: 'initialize_aes_key',
  AES_ENCRYPT: 'aes_encrypt',
  AES_DECRYPT: 'aes_decrypt',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

/**
 * Message data type mapping
 */
export type MessageDataMap = {
  [MessageType.INITIALIZE_AES_KEY]: {
    publicKey: Uint8Array;
    principal: Principal;
    encryptedAesKey?: Uint8Array;
    encryptedKey?: Uint8Array;
  };
  [MessageType.AES_ENCRYPT]: {
    plaintext: Uint8Array;
  };
  [MessageType.AES_DECRYPT]: {
    ciphertext: Uint8Array;
  };
};

/**
 * Message types for ICPWorker
 */
export type ICPWorkerMessage = {
  [K in MessageType]: {
    type: K;
    data: MessageDataMap[K];
  };
}[MessageType];

/**
 * Response data type mapping
 */
export type ResponseDataMap = {
  [MessageType.INITIALIZE_AES_KEY]: Uint8Array | undefined;
  [MessageType.AES_ENCRYPT]: Uint8Array;
  [MessageType.AES_DECRYPT]: Uint8Array;
};

/**
 * Response types from ICPWorker
 */
export type ICPWorkerResponse<T extends MessageType = MessageType> = {
  type: T;
  data: ResponseDataMap[T] | undefined;
  error?: string;
};

/**
 * Message handler type
 */
type MessageHandler<T extends MessageType> = (
  data: MessageDataMap[T],
) => Promise<ResponseDataMap[T]>;

/**
 * ICPWorker class for handling ICP backend operations
 */
export class ICPWorker {
  private messageHandlers: Map<MessageType, MessageHandler<any>>;
  private aesRawKey: Uint8Array | undefined = undefined;
  private tsk: TransportSecretKeyWrapper;

  /**
   * Create a new ICPWorker instance
   */
  constructor() {
    this.messageHandlers = new Map();
    this.initializeHandlers();
    const tskSeed = platformCrypto.getRandomBytes(32);
    this.tsk = createTransportSecretKey(tskSeed);
  }

  /**
   * Initialize message handlers
   */
  private initializeHandlers(): void {
    this.messageHandlers.set(
      MessageType.INITIALIZE_AES_KEY,
      this.handleInitializeAesKey.bind(this),
    );

    this.messageHandlers.set(
      MessageType.AES_ENCRYPT,
      this.handleAesEncrypt.bind(this),
    );

    this.messageHandlers.set(
      MessageType.AES_DECRYPT,
      this.handleAesDecrypt.bind(this),
    );
  }

  /**
   * Handle AES key initialization
   * @param data - The data for AES key initialization
   * @returns Promise with the encrypted AES key or undefined
   */
  private async handleInitializeAesKey({
    publicKey,
    principal,
    encryptedAesKey,
    encryptedKey,
  }: MessageDataMap[typeof MessageType.INITIALIZE_AES_KEY]): Promise<
    Uint8Array | undefined
  > {
    // If encrypted AES key and encryptedKey are provided, decrypt them
    if (encryptedAesKey && encryptedKey) {
      return this.decryptAesKey({
        encryptedAesKey,
        encryptedKey,
        publicKey,
        principal,
      });
    } else {
      // Generate and encrypt a new AES key
      return this.generateAndEncryptAesKey({ publicKey, principal });
    }
  }

  /**
   * Decrypt an AES key using IBE
   * @param params - Parameters for decryption
   * @returns Promise that resolves when decryption is complete
   */
  private async decryptAesKey({
    encryptedAesKey,
    encryptedKey,
    publicKey,
    principal,
  }: {
    encryptedAesKey: Uint8Array;
    encryptedKey: Uint8Array;
    publicKey: Uint8Array;
    principal: Principal;
  }): Promise<undefined> {
    try {
      // Decrypt the AES key using IBE
      const decryptedKey = await ibeDecrypt({
        ciphertext: encryptedAesKey,
        principal,
        encryptedKey,
        publicKey,
        tsk: this.tsk,
      });

      // Store the decrypted key
      this.aesRawKey = decryptedKey;
      return undefined;
    } catch (error) {
      console.error('Failed to decrypt AES key:', error);
      throw error;
    }
  }

  /**
   * Generate and encrypt a new AES key
   * @param params - Parameters for key generation and encryption
   * @returns Promise with the encrypted AES key or undefined
   */
  private async generateAndEncryptAesKey({
    publicKey,
    principal,
  }: {
    publicKey: Uint8Array;
    principal: Principal;
  }): Promise<Uint8Array | undefined> {
    // Generate AES key with fixed length of 32 bytes
    const key = platformCrypto.getRandomBytes(32);
    this.aesRawKey = key;

    if (principal.isAnonymous()) {
      return undefined;
    }

    // Generate random seed for IBE encryption
    const seed = platformCrypto.getRandomBytes(32);

    // Encrypt the AES key using IBE
    const encryptedBytes = await ibeEncrypt({
      data: key,
      principal,
      publicKey,
      seed,
    });

    // Return the encrypted AES key
    return encryptedBytes;
  }

  /**
   * Handle AES encryption
   * @param data - The data for AES encryption
   * @returns Promise with the encrypted data
   */
  private async handleAesEncrypt({
    plaintext,
  }: MessageDataMap[typeof MessageType.AES_ENCRYPT]): Promise<Uint8Array> {
    // Use the internally stored key as a priority
    if (this.aesRawKey) {
      const encryptedBytes = await platformCrypto.aesEncryptAsync(
        plaintext,
        this.aesRawKey,
      );
      return encryptedBytes;
    }

    // Error if no internal key is available
    throw new Error('No AES key available. Generate a key first.');
  }

  /**
   * Handle AES decryption
   * @param data - The data for AES decryption
   * @returns Promise with the decrypted data
   */
  private async handleAesDecrypt({
    ciphertext,
  }: MessageDataMap[typeof MessageType.AES_DECRYPT]): Promise<Uint8Array> {
    // Use the internally stored key as a priority
    if (this.aesRawKey) {
      const decryptedBytes = await platformCrypto.aesDecryptAsync(
        ciphertext,
        this.aesRawKey,
      );
      return decryptedBytes;
    }

    // Error if no internal key is available
    throw new Error('No AES key available. Generate a key first.');
  }

  /**
   * Check if an AES key is available
   * @returns boolean indicating if a key is available
   */
  public hasAesKey(): boolean {
    return this.aesRawKey !== undefined;
  }

  /**
   * Get the public key from the transport secret key
   * @returns {Uint8Array} The public key for transport secret key
   */
  public getTransportPublicKey(): Uint8Array {
    return this.tsk.getPublicKey();
  }

  /**
   * Handle incoming messages
   * @param message - The message to process
   * @returns Promise with the response
   */
  async onmessage<T extends MessageType>(message: {
    type: T;
    data: MessageDataMap[T];
  }): Promise<ICPWorkerResponse<T>> {
    try {
      const handler = this.messageHandlers.get(message.type) as
        | MessageHandler<T>
        | undefined;
      if (!handler) {
        throw new Error(`Unknown message type: ${message.type}`);
      }

      const result = await handler(message.data);
      return {
        type: message.type,
        data: result,
      };
    } catch (error) {
      return {
        type: message.type,
        data: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Post a message to the worker
   * @param message - The message to post
   * @returns Promise with the response
   */
  async postMessage<T extends MessageType>(message: {
    type: T;
    data: MessageDataMap[T];
  }): Promise<ICPWorkerResponse<T>> {
    return this.onmessage(message);
  }
}
