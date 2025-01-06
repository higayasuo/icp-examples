import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Retrieves the platform-specific local host address.
 *
 * - For Android, it returns '10.0.2.2'.
 * - For web, it returns 'localhost'.
 * - For iOS, it extracts the IP address from the hostUri in expoConfig.
 *   - If hostUri is not available, it falls back to '127.0.0.1'.
 *
 * @returns {string} - The local host address.
 */
export const getLocalHostAddress = (): string => {
  // if (Platform.OS === 'android') {
  //   return '10.0.2.2';
  // }

  if (Platform.OS === 'web') {
    return 'localhost';
  }

  // For iOS
  const hostUrl = Constants.expoConfig?.hostUri;

  if (hostUrl) {
    // hostUri format is like "192.168.1.5:8081", extract IP address part
    return hostUrl.split(':')[0];
  }

  // Fallback
  return '127.0.0.1';
};
