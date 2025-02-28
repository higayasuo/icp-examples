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
import { usePathname } from 'expo-router';
import { getInternetIdentityURL } from '@/icp/getInternetIdentityURL';
import { AuthClient } from '@dfinity/auth-client';
import { Platform } from 'react-native';
import { AesOperations } from '@/icp/AesOperations';
import { restorePreLoginScreen } from '@/utils/navigationUtils';

// Create a single instance of AesOperations to be used across the app
const aesOperations = new AesOperations();

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
  }, [url, baseKey, identity]);

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

  return {
    identity,
    isReady,
    isAuthenticated: !!identity,
    login,
    logout,
    decryptExistingAesKey:
      aesOperations.decryptExistingAesKey.bind(aesOperations),
    generateAesKey: aesOperations.generateAesKey.bind(aesOperations),
    generateAndEncryptAesKey:
      aesOperations.generateAndEncryptAesKey.bind(aesOperations),
    aesEncrypt: aesOperations.aesEncrypt.bind(aesOperations),
    aesDecrypt: aesOperations.aesDecrypt.bind(aesOperations),
    hasAesKey: aesOperations.hasAesKey,
    clearAesRawKey: aesOperations.clearAesRawKey.bind(aesOperations),
    transportPublicKey: aesOperations.transportPublicKey,
  };
}
