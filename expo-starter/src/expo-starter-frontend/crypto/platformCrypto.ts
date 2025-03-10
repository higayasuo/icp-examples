import { CryptoModule } from './CryptoModule';
import { standardCrypto } from './StandardCrypto';

/**
 * CryptoModule implementation that dynamically selects between StandardCrypto and NativeCrypto
 * Uses NativeCrypto for native platforms when Expo and React Native are available,
 * otherwise falls back to StandardCrypto
 */
let cryptoImplementation: CryptoModule = standardCrypto;

try {
  // Try to detect if we're in a React Native environment
  const Platform = require('react-native').Platform;
  if (Platform.OS !== 'web') {
    const { nativeCrypto } = require('./NativeCrypto');
    cryptoImplementation = nativeCrypto;
  }
} catch (error) {
  // Fallback to standardCrypto if React Native or Expo is not available
  console.log('Using standard crypto implementation');
}

export const platformCrypto: CryptoModule = cryptoImplementation;
