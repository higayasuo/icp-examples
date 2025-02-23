import * as ExpoCrypto from 'expo-crypto';
import { CryptoModule } from './CryptoModule';
import CryptoJS from 'crypto-js';
import { compareUint8Arrays } from './uint8ArrayUtils';

/**
 * Convert Uint8Array to WordArray
 */
function uint8ArrayToWordArray(u8arr: Uint8Array): CryptoJS.lib.WordArray {
  const len = u8arr.length;
  const words = [];
  for (let i = 0; i < len; i += 4) {
    words.push(
      ((u8arr[i] || 0) << 24) |
        ((u8arr[i + 1] || 0) << 16) |
        ((u8arr[i + 2] || 0) << 8) |
        (u8arr[i + 3] || 0),
    );
  }
  return CryptoJS.lib.WordArray.create(words, len);
}

/**
 * Convert WordArray to Uint8Array
 */
function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  let offset = 0;
  for (let i = 0; i < words.length && offset < sigBytes; i++) {
    const word = words[i];
    for (let j = 0; j < 4 && offset < sigBytes; j++) {
      u8[offset] = (word >> (24 - j * 8)) & 0xff;
      offset++;
    }
  }
  return u8;
}

export class NativeCrypto implements CryptoModule {
  getRandomBytes(size: number): Uint8Array {
    return ExpoCrypto.getRandomBytes(size);
  }

  sha256Async(code: string): Promise<string> {
    return ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      code,
      {
        encoding: ExpoCrypto.CryptoEncoding.BASE64,
      },
    );
  }

  async aesEncryptAsync(
    data: Uint8Array,
    rawKey: Uint8Array,
  ): Promise<Uint8Array> {
    // Generate random IV and HMAC key
    const iv = this.getRandomBytes(16);
    const hmacKey = this.getRandomBytes(32);

    // Convert data and keys to WordArrays
    const keyWords = uint8ArrayToWordArray(rawKey);
    const dataWords = uint8ArrayToWordArray(data);
    const ivWords = uint8ArrayToWordArray(iv);
    const hmacKeyWords = uint8ArrayToWordArray(hmacKey);

    // Encrypt data
    const encrypted = CryptoJS.AES.encrypt(dataWords, keyWords, {
      iv: ivWords,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Get ciphertext as WordArray
    const ciphertext = encrypted.ciphertext;

    // Combine IV, HMAC key, and encrypted data
    const encryptedData = new Uint8Array(
      iv.length + hmacKey.length + ciphertext.sigBytes,
    );
    encryptedData.set(iv, 0);
    encryptedData.set(hmacKey, iv.length);
    encryptedData.set(
      wordArrayToUint8Array(ciphertext),
      iv.length + hmacKey.length,
    );

    // Generate HMAC
    const hmac = CryptoJS.HmacSHA256(
      uint8ArrayToWordArray(encryptedData),
      hmacKeyWords,
    );

    // Convert HMAC WordArray to Uint8Array
    const hmacArray = wordArrayToUint8Array(hmac);

    // Combine everything: [IV][HMAC_KEY][encrypted][HMAC]
    const result = new Uint8Array(encryptedData.length + 32);
    result.set(encryptedData, 0);
    result.set(hmacArray, encryptedData.length);

    return result;
  }

  async aesDecryptAsync(
    data: Uint8Array,
    rawKey: Uint8Array,
  ): Promise<Uint8Array> {
    try {
      // Split the data
      const iv = data.slice(0, 16);
      const hmacKey = data.slice(16, 48);
      const encrypted = data.slice(48, -32);
      const receivedHmac = data.slice(-32);

      // Convert to WordArrays
      const keyWords = uint8ArrayToWordArray(rawKey);
      const ivWords = uint8ArrayToWordArray(iv);
      const hmacKeyWords = uint8ArrayToWordArray(hmacKey);

      // Verify HMAC
      const calculatedHmac = CryptoJS.HmacSHA256(
        uint8ArrayToWordArray(data.slice(0, -32)),
        hmacKeyWords,
      );

      // Convert HMAC WordArray to Uint8Array
      const calculatedHmacArray = wordArrayToUint8Array(calculatedHmac);

      // Compare HMACs
      if (!compareUint8Arrays(calculatedHmacArray, receivedHmac)) {
        throw new Error('Invalid HMAC');
      }

      // Create ciphertext params
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: uint8ArrayToWordArray(encrypted),
        iv: ivWords,
      });

      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWords, {
        iv: ivWords,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Convert WordArray to Uint8Array
      return wordArrayToUint8Array(decrypted);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid HMAC') {
        throw error;
      }
      throw new Error('Decryption failed');
    }
  }
}

export const nativeCrypto = new NativeCrypto();
