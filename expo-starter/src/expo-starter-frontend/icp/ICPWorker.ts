import { platformCrypto } from '@/crypto/platformCrypto';
import { ibeEncrypt } from './ibeEncrypt';
import { Principal } from '@dfinity/principal';
import { _SERVICE } from './expo-starter-backend.did';
import {
  TransportSecretKeyWrapper,
  createTransportSecretKey,
} from './TransportSecretKeyWrapper';

/**
 * Message type literals
 */
export const MessageType = {
  INITIALIZE_AES_KEY: 'initialize_aes_key',
  AES_ENCRYPT: 'aes_encrypt',
  AES_DECRYPT: 'aes_decrypt',
  OTHER: 'other',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

/**
 * Message data type mapping
 */
export type MessageDataMap = {
  [MessageType.INITIALIZE_AES_KEY]: {
    publicKey: Uint8Array;
    principal: Principal;
  };
  [MessageType.AES_ENCRYPT]: {
    plaintext: Uint8Array;
  };
  [MessageType.AES_DECRYPT]: {
    ciphertext: Uint8Array;
  };
  [MessageType.OTHER]: any;
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
  [MessageType.OTHER]: any;
};

/**
 * Response types from ICPWorker
 */
export type ICPWorkerResponse<T extends MessageType = MessageType> = {
  type: T;
  data: ResponseDataMap[T] | null;
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
      async ({
        publicKey,
        principal,
      }: MessageDataMap[typeof MessageType.INITIALIZE_AES_KEY]) => {
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
      },
    );

    this.messageHandlers.set(
      MessageType.AES_ENCRYPT,
      async ({ plaintext }: MessageDataMap[typeof MessageType.AES_ENCRYPT]) => {
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
      },
    );

    this.messageHandlers.set(
      MessageType.AES_DECRYPT,
      async ({
        ciphertext,
      }: MessageDataMap[typeof MessageType.AES_DECRYPT]) => {
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
      },
    );
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
        data: null,
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
