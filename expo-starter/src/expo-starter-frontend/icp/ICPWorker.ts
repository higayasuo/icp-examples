import { platformCrypto } from '@/crypto/platformCrypto';
import { ibeEncrypt } from './ibeEncrypt';
import { Principal } from '@dfinity/principal';
import { ActorSubclass } from '@dfinity/agent';
import { _SERVICE } from './expo-starter-backend.did';

/**
 * Message type literals
 */
export const MessageType = {
  GENERATE_AES_KEY: 'generate_aes_key',
  IBE_ENCRYPT: 'ibe_encrypt',
  AES_ENCRYPT: 'aes_encrypt',
  AES_DECRYPT: 'aes_decrypt',
  OTHER: 'other',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

/**
 * Message data type mapping
 */
export type MessageDataMap = {
  [MessageType.GENERATE_AES_KEY]: {
    keyLength: number;
  };
  [MessageType.IBE_ENCRYPT]: {
    data: Uint8Array;
    principal: Principal;
    publicKey: Uint8Array;
  };
  [MessageType.AES_ENCRYPT]: {
    plaintext: Uint8Array;
    key: Uint8Array;
  };
  [MessageType.AES_DECRYPT]: {
    ciphertext: Uint8Array;
    key: Uint8Array;
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
  [MessageType.GENERATE_AES_KEY]: Uint8Array;
  [MessageType.IBE_ENCRYPT]: Uint8Array;
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

  /**
   * Create a new ICPWorker instance
   */
  constructor() {
    this.messageHandlers = new Map();
    this.initializeHandlers();
  }

  /**
   * Initialize message handlers
   */
  private initializeHandlers(): void {
    this.messageHandlers.set(
      MessageType.GENERATE_AES_KEY,
      async ({
        keyLength,
      }: MessageDataMap[typeof MessageType.GENERATE_AES_KEY]) => {
        // Generate AES key
        return platformCrypto.getRandomBytes(keyLength);
      },
    );

    this.messageHandlers.set(
      MessageType.IBE_ENCRYPT,
      async ({
        data,
        principal,
        publicKey,
      }: MessageDataMap[typeof MessageType.IBE_ENCRYPT]) => {
        // Generate random seed for IBE encryption
        const seed = platformCrypto.getRandomBytes(32);

        // Perform IBE encryption
        const encryptedBytes = await ibeEncrypt({
          data,
          principal,
          publicKey,
          seed,
        });

        return encryptedBytes;
      },
    );

    this.messageHandlers.set(
      MessageType.AES_ENCRYPT,
      async ({
        plaintext,
        key,
      }: MessageDataMap[typeof MessageType.AES_ENCRYPT]) => {
        const encryptedBytes = await platformCrypto.aesEncryptAsync(
          plaintext,
          key,
        );
        return encryptedBytes;
      },
    );

    this.messageHandlers.set(
      MessageType.AES_DECRYPT,
      async ({
        ciphertext,
        key,
      }: MessageDataMap[typeof MessageType.AES_DECRYPT]) => {
        const decryptedBytes = await platformCrypto.aesDecryptAsync(
          ciphertext,
          key,
        );
        return decryptedBytes;
      },
    );
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
