import * as base64 from 'base64-js';
import { CryptoModule } from './CryptoModule';
import { compareUint8Arrays } from './uint8ArrayUtils';

export function textEncodeLite(str: string) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);

  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

export class StandardCrypto implements CryptoModule {
  getRandomBytes(size: number): Uint8Array {
    const input = new Uint8Array(size);
    return crypto.getRandomValues(input);
  }

  sha256Async(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.subtle.digest('SHA-256', textEncodeLite(code)).then(
        (buffer) => {
          return resolve(base64.fromByteArray(new Uint8Array(buffer)));
        },
        (error) => reject(error),
      );
    });
  }

  async aesEncryptAsync(
    data: Uint8Array,
    rawKey: Uint8Array,
  ): Promise<Uint8Array> {
    // Generate random IV and HMAC key
    const iv = this.getRandomBytes(16);
    const hmacKey = this.getRandomBytes(32);

    // Import AES-256-CBC key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-CBC', length: 256 },
      false,
      ['encrypt'],
    );

    // Import HMAC key
    const hmacKeyObj = await crypto.subtle.importKey(
      'raw',
      hmacKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      aesKey,
      data,
    );

    // Combine IV, HMAC key, and encrypted data
    const encryptedData = new Uint8Array(
      iv.length + hmacKey.length + encrypted.byteLength,
    );
    encryptedData.set(iv, 0);
    encryptedData.set(hmacKey, iv.length);
    encryptedData.set(new Uint8Array(encrypted), iv.length + hmacKey.length);

    // Generate HMAC (use full 32 bytes)
    const hmac = new Uint8Array(
      await crypto.subtle.sign('HMAC', hmacKeyObj, encryptedData),
    );

    // Combine everything: [IV][HMAC_KEY][encrypted][HMAC]
    const result = new Uint8Array(encryptedData.length + hmac.byteLength);
    result.set(encryptedData, 0);
    result.set(hmac, encryptedData.length);

    return result;
  }

  async aesDecryptAsync(
    data: Uint8Array,
    rawKey: Uint8Array,
  ): Promise<Uint8Array> {
    // Split the data
    const iv = data.slice(0, 16);
    const hmacKey = data.slice(16, 48);
    const encrypted = data.slice(48, -32);
    const receivedHmac = data.slice(-32);

    // Import HMAC key
    const hmacKeyObj = await crypto.subtle.importKey(
      'raw',
      hmacKey,
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign'],
    );

    // Generate HMAC for verification
    const calculatedHmac = new Uint8Array(
      await crypto.subtle.sign('HMAC', hmacKeyObj, data.slice(0, -32)),
    );

    // Verify HMAC
    if (!compareUint8Arrays(calculatedHmac, receivedHmac)) {
      throw new Error('Invalid HMAC');
    }

    // Import AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-CBC', length: 256 },
      false,
      ['decrypt'],
    );

    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      aesKey,
      encrypted,
    );

    return new Uint8Array(decrypted);
  }
}

export const standardCrypto = new StandardCrypto();
