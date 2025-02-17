import * as ExpoCrypto from 'expo-crypto';

import { CryptoModule } from './CryptoModule';

class NativeCrypto implements CryptoModule {
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
}
export const nativeCrypto = new NativeCrypto();
