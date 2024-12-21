import { Actor, HttpAgent, ActorSubclass } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { getProfileName } from '../config';

/**
 * Determines the DFX network environment.
 * @returns {'local' | 'ic'} - Returns 'local' if the environment is local, otherwise 'ic'.
 */
export const getDfxNetwork = (): 'local' | 'ic' => {
  if (process.env.NEXT_PUBLIC_DFX_NETWORK === 'local') {
    return 'local';
  }
  if (getProfileName() === 'development') {
    return 'local';
  }
  return 'ic';
};

/**
 * Checks if the current environment is local.
 * @returns {boolean} - Returns true if the environment is local, otherwise false.
 */
export const isLocal = (): boolean => getDfxNetwork() === 'local';

/**
 * Gets the appropriate host address based on the platform and environment
 * @returns {string} The host address to use
 */
const getHostAddress = (): string => {
  if (!isLocal()) {
    return 'https://${canisterId}.ic0.app';
  }

  // For Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4943';
  }

  // For Web environment
  if (Platform.OS === 'web') {
    return 'http://localhost:4943';
  }

  // For iOS or other environments, use Expo debug server host
  const debugHost = Constants.expoConfig?.hostUri;
  if (debugHost) {
    // hostUri format is like "192.168.1.5:8081", extract IP address part
    const hostIp = debugHost.split(':')[0];
    return `http://${hostIp}:4943`;
  }

  // Fallback
  return 'http://127.0.0.1:4943';
};

/**
 * Creates an actor for interacting with a canister.
 * @template T - The type of the actor.
 * @param {string} canisterId - The ID of the canister.
 * @param {IDL.InterfaceFactory} interfaceFactory - The interface factory for the canister.
 * @returns {ActorSubclass<T>} - Returns an actor subclass for the specified canister.
 */
export function createActor<T>(
  canisterId: string,
  interfaceFactory: IDL.InterfaceFactory,
): ActorSubclass<T> {
  console.log('platform:', Platform.OS);
  console.log('isLocal:', isLocal());

  const host = getHostAddress();
  console.log('host:', host);

  const hostOptions = {
    host: host.includes('${canisterId}')
      ? host.replace('${canisterId}', canisterId)
      : host,
  };
  console.log('hostOptions:', hostOptions);

  const agent = HttpAgent.createSync(hostOptions);

  if (isLocal()) {
    agent.fetchRootKey().catch((err) => {
      console.warn('Your local replica is not running');
      console.error(err);
    });
  }

  return Actor.createActor<T>(interfaceFactory, {
    agent,
    canisterId,
  });
}
