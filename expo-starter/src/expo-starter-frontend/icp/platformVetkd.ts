import { Platform } from 'react-native';
import * as vetkd from 'ic-vetkd-utils';
import * as vetkdWasm2js from 'ic-vetkd-utils-wasm2js';

console.log('Platform.OS', Platform.OS);
// Export the appropriate implementation based on platform
export const platformVetkd =
  Platform.OS === 'web' ? vetkdWasm2js : vetkdWasm2js;

// Export specific types for TypeScript
export type TransportSecretKey = InstanceType<typeof vetkd.TransportSecretKey>;
export type IBECiphertext = InstanceType<typeof vetkd.IBECiphertext>;
