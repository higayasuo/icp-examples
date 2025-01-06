import { Platform } from 'react-native';

/**
 * Checks if the current environment supports subdomains.
 *
 * This function determines subdomain support based on the platform and environment.
 * Mobile platforms (iOS/Android) are considered to not support localhost subdomains
 * due to networking restrictions in mobile environments.
 *
 * @returns {boolean} - True if subdomains are supported, false otherwise.
 */
export const isSubdomainSupported = (): boolean => {
  // Mobile platforms don't support localhost subdomains
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return false;
  }

  // Only perform URL test in web environment
  try {
    new URL('http://test.localhost');
    return true;
  } catch (e) {
    return false;
  }
};
