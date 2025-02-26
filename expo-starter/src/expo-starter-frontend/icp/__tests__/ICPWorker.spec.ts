import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ICPWorker, MessageType } from '../ICPWorker';
import { ibeDecrypt } from '../ibeDecrypt';
import { ibeEncrypt } from '../ibeEncrypt';
import { Principal } from '@dfinity/principal';
import { platformCrypto } from '@/crypto/platformCrypto';

// Mock dependencies
vi.mock('../ibeDecrypt', () => ({
  ibeDecrypt: vi.fn(),
}));

vi.mock('../ibeEncrypt', () => ({
  ibeEncrypt: vi.fn(),
}));

vi.mock('@/crypto/platformCrypto', () => ({
  platformCrypto: {
    getRandomBytes: vi.fn(() => new Uint8Array(32)),
    aesEncryptAsync: vi.fn(),
    aesDecryptAsync: vi.fn(),
  },
}));

vi.mock('../TransportSecretKeyWrapper', () => ({
  createTransportSecretKey: vi.fn(() => ({
    getPublicKey: vi.fn(() => new Uint8Array(32)),
    decrypt: vi.fn(),
  })),
}));

describe('ICPWorker', () => {
  let worker: ICPWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    worker = new ICPWorker();
  });

  describe('handleInitializeAesKey', () => {
    it('should decrypt AES key when encryptedAesKey and encryptedKey are provided', async () => {
      // Arrange
      const encryptedAesKey = new Uint8Array([1, 2, 3]);
      const encryptedKey = new Uint8Array([4, 5, 6]);
      const publicKey = new Uint8Array([7, 8, 9]);
      const principal = Principal.fromText('aaaaa-aa');
      const decryptedKey = new Uint8Array([10, 11, 12]);

      // Mock ibeDecrypt to return a decrypted key
      (ibeDecrypt as any).mockResolvedValue(decryptedKey);

      // Act
      const result = await worker.postMessage({
        type: MessageType.INITIALIZE_AES_KEY,
        data: {
          encryptedAesKey,
          encryptedKey,
          publicKey,
          principal,
        },
      });

      // Assert
      expect(ibeDecrypt).toHaveBeenCalledWith({
        ciphertext: encryptedAesKey,
        principal,
        encryptedKey,
        publicKey,
        tsk: expect.anything(),
      });

      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();

      // Verify the key is stored by testing encryption
      const plaintext = new Uint8Array([20, 21, 22]);
      const encryptedData = new Uint8Array([30, 31, 32]);
      (platformCrypto.aesEncryptAsync as any).mockResolvedValue(encryptedData);

      const encryptResult = await worker.postMessage({
        type: MessageType.AES_ENCRYPT,
        data: { plaintext },
      });

      expect(platformCrypto.aesEncryptAsync).toHaveBeenCalledWith(
        plaintext,
        decryptedKey,
      );
      expect(encryptResult.data).toBe(encryptedData);
    });

    it('should generate and encrypt a new AES key when no encrypted keys are provided', async () => {
      // Arrange
      const publicKey = new Uint8Array([7, 8, 9]);
      const principal = Principal.fromText('aaaaa-aa');
      const generatedKey = new Uint8Array(32);
      const encryptedBytes = new Uint8Array([40, 41, 42]);

      // Mock getRandomBytes to return a generated key
      (platformCrypto.getRandomBytes as any).mockReturnValue(generatedKey);

      // Mock ibeEncrypt to return encrypted bytes
      (ibeEncrypt as any).mockResolvedValue(encryptedBytes);

      // Act
      const result = await worker.postMessage({
        type: MessageType.INITIALIZE_AES_KEY,
        data: {
          publicKey,
          principal,
        },
      });

      // Assert
      expect(platformCrypto.getRandomBytes).toHaveBeenCalledWith(32);
      expect(ibeEncrypt).toHaveBeenCalledWith({
        data: generatedKey,
        principal,
        publicKey,
        seed: expect.any(Uint8Array),
      });

      expect(result.data).toBe(encryptedBytes);
      expect(result.error).toBeUndefined();
    });

    it('should return undefined when principal is anonymous', async () => {
      // Arrange
      const publicKey = new Uint8Array([7, 8, 9]);
      const principal = Principal.anonymous();
      const generatedKey = new Uint8Array(32);

      // Mock getRandomBytes to return a generated key
      (platformCrypto.getRandomBytes as any).mockReturnValue(generatedKey);

      // Act
      const result = await worker.postMessage({
        type: MessageType.INITIALIZE_AES_KEY,
        data: {
          publicKey,
          principal,
        },
      });

      // Assert
      expect(platformCrypto.getRandomBytes).toHaveBeenCalledWith(32);
      expect(ibeEncrypt).not.toHaveBeenCalled();

      expect(result.data).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should handle errors during decryption', async () => {
      // Arrange
      const encryptedAesKey = new Uint8Array([1, 2, 3]);
      const encryptedKey = new Uint8Array([4, 5, 6]);
      const publicKey = new Uint8Array([7, 8, 9]);
      const principal = Principal.fromText('aaaaa-aa');

      // Mock ibeDecrypt to throw an error
      const errorMessage = 'Decryption failed';
      (ibeDecrypt as any).mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await worker.postMessage({
        type: MessageType.INITIALIZE_AES_KEY,
        data: {
          encryptedAesKey,
          encryptedKey,
          publicKey,
          principal,
        },
      });

      // Assert
      expect(result.data).toBeUndefined();
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('handleAesEncrypt', () => {
    it('should encrypt data with stored AES key', async () => {
      // Arrange
      const plaintext = new Uint8Array([1, 2, 3]);
      const encryptedData = new Uint8Array([4, 5, 6]);

      // Set up a key in the worker
      const publicKey = new Uint8Array([7, 8, 9]);
      const principal = Principal.fromText('aaaaa-aa');
      await worker.postMessage({
        type: MessageType.INITIALIZE_AES_KEY,
        data: { publicKey, principal },
      });

      // Mock aesEncryptAsync
      (platformCrypto.aesEncryptAsync as any).mockResolvedValue(encryptedData);

      // Act
      const result = await worker.postMessage({
        type: MessageType.AES_ENCRYPT,
        data: { plaintext },
      });

      // Assert
      expect(platformCrypto.aesEncryptAsync).toHaveBeenCalledWith(
        plaintext,
        expect.any(Uint8Array),
      );
      expect(result.data).toBe(encryptedData);
      expect(result.error).toBeUndefined();
    });

    it('should throw error when no AES key is available', async () => {
      // Arrange
      const plaintext = new Uint8Array([1, 2, 3]);

      // Create a new worker without initializing a key
      const newWorker = new ICPWorker();

      // Act
      const result = await newWorker.postMessage({
        type: MessageType.AES_ENCRYPT,
        data: { plaintext },
      });

      // Assert
      expect(platformCrypto.aesEncryptAsync).not.toHaveBeenCalled();
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('No AES key available. Generate a key first.');
    });
  });

  describe('handleAesDecrypt', () => {
    it('should decrypt data with stored AES key', async () => {
      // Arrange
      const ciphertext = new Uint8Array([1, 2, 3]);
      const decryptedData = new Uint8Array([4, 5, 6]);

      // Set up a key in the worker
      const publicKey = new Uint8Array([7, 8, 9]);
      const principal = Principal.fromText('aaaaa-aa');
      await worker.postMessage({
        type: MessageType.INITIALIZE_AES_KEY,
        data: { publicKey, principal },
      });

      // Mock aesDecryptAsync
      (platformCrypto.aesDecryptAsync as any).mockResolvedValue(decryptedData);

      // Act
      const result = await worker.postMessage({
        type: MessageType.AES_DECRYPT,
        data: { ciphertext },
      });

      // Assert
      expect(platformCrypto.aesDecryptAsync).toHaveBeenCalledWith(
        ciphertext,
        expect.any(Uint8Array),
      );
      expect(result.data).toBe(decryptedData);
      expect(result.error).toBeUndefined();
    });

    it('should throw error when no AES key is available', async () => {
      // Arrange
      const ciphertext = new Uint8Array([1, 2, 3]);

      // Create a new worker without initializing a key
      const newWorker = new ICPWorker();

      // Act
      const result = await newWorker.postMessage({
        type: MessageType.AES_DECRYPT,
        data: { ciphertext },
      });

      // Assert
      expect(platformCrypto.aesDecryptAsync).not.toHaveBeenCalled();
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('No AES key available. Generate a key first.');
    });
  });
});
