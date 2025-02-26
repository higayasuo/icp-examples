import { useState, useEffect } from 'react';
import { toHex } from '@dfinity/agent';
import {
  Ed25519KeyIdentity,
  DelegationChain,
  DelegationIdentity,
  isDelegationValid,
} from '@dfinity/identity';
import * as WebBrowser from 'expo-web-browser';
import { useURL, createURL } from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getCanisterURL } from '@/icp/getCanisterURL';
import { ENV_VARS } from '@/icp/env.generated';
import { router, usePathname, Href } from 'expo-router';
import { getInternetIdentityURL } from '@/icp/getInternetIdentityURL';
import { AuthClient } from '@dfinity/auth-client';
import { Platform } from 'react-native';
import { Principal } from '@dfinity/principal';
import { ICPWorker, MessageType } from '@/icp/ICPWorker';

const navigate = (path: string) => {
  try {
    // Try to navigate to the stored path
    router.replace(path as Href);
  } catch {
    // If navigation fails, go to the home page
    console.warn('Navigation failed, redirecting to home');
    router.replace('/');
  }
};

const restorePreLoginScreen = async () => {
  const path = await AsyncStorage.getItem('lastPath');

  if (path) {
    navigate(path);
    await AsyncStorage.removeItem('lastPath');
  } else {
    router.replace('/');
  }
};

export function useAuth() {
  const [baseKey, setBaseKey] = useState<Ed25519KeyIdentity | undefined>(
    undefined,
  );
  const [isReady, setIsReady] = useState(false);
  const url = useURL();
  const pathname = usePathname();
  const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
    undefined,
  );
  const [authClient, setAuthClient] = useState<AuthClient | undefined>(
    undefined,
  );
  const [worker] = useState(() => new ICPWorker());

  // Initialize auth state
  useEffect(() => {
    if (isReady) {
      console.log('skipping first useEffect');
      return;
    }

    (async () => {
      if (Platform.OS === 'web') {
        const authClient = await AuthClient.create();
        setAuthClient(authClient);
        console.log('authClient created');
        const authenticated = await authClient.isAuthenticated();
        console.log('authenticated', authenticated);

        if (authenticated) {
          const identity = authClient.getIdentity() as DelegationIdentity;
          setIdentity(identity);
          console.log('identity set from authClient');
        }

        setIsReady(true);
        return;
      }

      const storedBaseKey = await SecureStore.getItemAsync('baseKey');

      if (storedBaseKey) {
        if (!baseKey) {
          console.log('Restoring baseKey');
          const key = Ed25519KeyIdentity.fromJSON(storedBaseKey);
          setBaseKey(key);
        }
      } else {
        console.log('Generating new baseKey');
        const key = Ed25519KeyIdentity.generate();
        await SecureStore.setItemAsync('baseKey', JSON.stringify(key.toJSON()));
        setBaseKey(key);
      }

      const storedDelegation = await AsyncStorage.getItem('delegation');

      if (!identity && storedBaseKey && storedDelegation) {
        const baseKey = Ed25519KeyIdentity.fromJSON(storedBaseKey);
        const delegation = DelegationChain.fromJSON(storedDelegation);
        const identity = DelegationIdentity.fromDelegation(baseKey, delegation);

        if (isDelegationValid(delegation)) {
          console.log('Setting identity from baseKey and delegation');
          setIdentity(identity);
        } else {
          console.log('Invalid delegation chain, removing delegation');
          await AsyncStorage.removeItem('delegation');
        }
      }

      setIsReady(true);
    })();
  }, []);

  // Handle URL changes for login callback
  useEffect(() => {
    if (identity || !baseKey || !url) {
      return;
    }

    const search = new URLSearchParams(url?.split('?')[1]);
    const delegation = search.get('delegation');

    if (delegation) {
      const chain = DelegationChain.fromJSON(JSON.parse(delegation));
      AsyncStorage.setItem('delegation', JSON.stringify(chain.toJSON()));
      const id = DelegationIdentity.fromDelegation(baseKey, chain);
      setIdentity(id);
      console.log('set identity from delegation');
      WebBrowser.dismissBrowser();
      restorePreLoginScreen();
    }
  }, [url, baseKey]);

  const login = async () => {
    if (Platform.OS === 'web') {
      if (!authClient) {
        throw new Error('Auth client not initialized');
      }

      const iiUri = getInternetIdentityURL();
      await authClient.login({
        identityProvider: iiUri,
        onSuccess: () => {
          const identity = authClient.getIdentity() as DelegationIdentity;
          setIdentity(identity);
          console.log('identity set from authClient');
        },
      });
      return;
    }

    const redirectUri = createURL('/');

    if (!baseKey) {
      throw new Error('No base key');
    }

    const pubkey = toHex(baseKey.getPublicKey().toDer());

    const iiUri = getInternetIdentityURL();

    const iiIntegrationURL = getCanisterURL(
      ENV_VARS.CANISTER_ID_II_INTEGRATION,
    );
    const url = new URL(iiIntegrationURL);

    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('pubkey', pubkey);
    url.searchParams.set('ii_uri', iiUri);

    await AsyncStorage.setItem('lastPath', pathname);
    await WebBrowser.openBrowserAsync(url.toString());
  };

  const logout = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!authClient) {
          throw new Error('Auth client not initialized');
        }

        await authClient.logout();
        setIdentity(undefined);
        console.log('identity set to undefined after logout for web');
        return;
      }

      await AsyncStorage.removeItem('delegation');
      setIdentity(undefined);
      console.log('identity set to undefined after logout for native');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  /**
   * Initialize AES key and encrypt it with IBE
   * @param params - Parameters for AES key initialization
   * @param params.publicKey - Public key for IBE encryption
   * @param params.principal - Principal for IBE encryption
   * @returns Promise with the encrypted AES key or undefined on failure
   */
  const initializeAesKey = ({
    publicKey,
    principal,
  }: {
    publicKey: Uint8Array;
    principal: Principal;
  }): Promise<Uint8Array | undefined> => {
    return worker
      .postMessage({
        type: MessageType.INITIALIZE_AES_KEY,
        data: { publicKey, principal },
      })
      .then((response) => {
        if (response.error) {
          console.error('Error initializing AES key:', response.error);
          return undefined;
        }
        // Convert null to undefined if needed
        return response.data ?? undefined;
      })
      .catch((error) => {
        console.error('Failed to initialize AES key:', error);
        return undefined;
      });
  };

  /**
   * Encrypt data using AES with the stored key
   * @param params - Parameters for AES encryption
   * @param params.plaintext - Data to encrypt
   * @returns Promise with the encrypted data or undefined on failure
   */
  const aesEncrypt = ({
    plaintext,
  }: {
    plaintext: Uint8Array;
  }): Promise<Uint8Array | undefined> => {
    return worker
      .postMessage({
        type: MessageType.AES_ENCRYPT,
        data: { plaintext },
      })
      .then((response) => {
        if (response.error) {
          console.error('Error encrypting with stored key:', response.error);
          return undefined;
        }
        // Convert null to undefined if needed
        return response.data ?? undefined;
      })
      .catch((error) => {
        console.error('Failed to encrypt with stored key:', error);
        return undefined;
      });
  };

  /**
   * Decrypt data using AES with the stored key
   * @param params - Parameters for AES decryption
   * @param params.ciphertext - Data to decrypt
   * @returns Promise with the decrypted data or undefined on failure
   */
  const aesDecrypt = ({
    ciphertext,
  }: {
    ciphertext: Uint8Array;
  }): Promise<Uint8Array | undefined> => {
    return worker
      .postMessage({
        type: MessageType.AES_DECRYPT,
        data: { ciphertext },
      })
      .then((response) => {
        if (response.error) {
          console.error('Error decrypting with stored key:', response.error);
          return undefined;
        }
        // Convert null to undefined if needed
        return response.data ?? undefined;
      })
      .catch((error) => {
        console.error('Failed to decrypt with stored key:', error);
        return undefined;
      });
  };

  /**
   * Check if the worker has an AES key
   * @returns boolean indicating if a key is available
   */
  const hasAesKey = (): boolean => {
    return worker.hasAesKey();
  };

  const getTransportPublicKey = (): Uint8Array => {
    return worker.getTransportPublicKey();
  };

  return {
    identity,
    isReady,
    login,
    logout,
    initializeAesKey,
    aesEncrypt,
    aesDecrypt,
    hasAesKey,
    getTransportPublicKey,
  };
}
