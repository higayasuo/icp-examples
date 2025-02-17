import { Platform } from 'react-native';
import { CryptoModule } from './CryptoModule';
import { standardCrypto } from './StandardCrypto';
import { nativeCrypto } from './NativeCrypto';

/**
 * Platform-specific CryptoModule implementation
 * Uses StandardCrypto for web and NativeCrypto for native platforms
 */
export const platformCrypto: CryptoModule =
  Platform.OS === 'web' ? standardCrypto : nativeCrypto;
