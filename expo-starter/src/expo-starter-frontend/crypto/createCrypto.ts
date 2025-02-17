import { Platform } from 'react-native';
import { CryptoModule } from './CryptoModule';
import { standardCrypto } from './StandardCrypto';
import { nativeCrypto } from './NativeCrypto';

/**
 * Creates a CryptoModule instance based on the current environment
 * @returns CryptoModule - StandardCrypto for web, NativeCrypto for native platforms
 */
export function createCrypto(): CryptoModule {
  if (Platform.OS === 'web') {
    return standardCrypto;
  }
  return nativeCrypto;
}

// Export a singleton instance
export const crypto = createCrypto();
