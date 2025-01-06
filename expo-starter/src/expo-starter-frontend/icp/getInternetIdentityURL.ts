import { Platform } from 'react-native';
import { ENV_VARS } from './env.generated';
import { getLocalHostAddress } from './getLocalHostAddress';

/**
 * Get the Internet Identity URL based on the current environment.
 *
 * @returns {string} The Internet Identity URL.
 */
export const getInternetIdentityURL = (): string => {
  // const network = ENV_VARS.DFX_NETWORK;
  // console.log('Current network:', network);

  // if (network === 'local') {
  //   const host = getLocalHostAddress();
  //   const canisterId = ENV_VARS.CANISTER_ID_INTERNET_IDENTITY;

  //   // For mobile platforms, use query parameter format
  //   if (Platform.OS === 'ios' || Platform.OS === 'android') {
  //     const url = `http://${host}:4943/?canisterId=${canisterId}`;
  //     console.log('Generated II URL (mobile):', url);
  //     return url;
  //   }

  //   // For web platform, use subdomain format
  //   const url = `http://${canisterId}.${host}:4943/`;
  //   console.log('Generated II URL (web):', url);
  //   return url;
  // }

  // Production URL
  return 'https://identity.ic0.app/';
};
