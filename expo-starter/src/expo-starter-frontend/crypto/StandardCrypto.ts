//import * as base64 from 'base64-js';

import { Buffer } from 'buffer';
import { CryptoModule } from './CryptoModule';

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
          return resolve(Buffer.from(buffer).toString('base64'));
        },
        (error) => reject(error),
      );
    });
  }
}

export const standardCrypto = new StandardCrypto();
