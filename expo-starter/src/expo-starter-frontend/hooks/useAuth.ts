import { useState, useEffect, useRef } from 'react';
import { toHex } from '@dfinity/agent';
import { Ed25519KeyIdentity, DelegationIdentity } from '@dfinity/identity';
import * as WebBrowser from 'expo-web-browser';
import { useURL, createURL } from 'expo-linking';

import { getCanisterURL } from '@/icp/getCanisterURL';
import { ENV_VARS } from '@/icp/env.generated';
import { getInternetIdentityURL } from '@/icp/getInternetIdentityURL';
import { AesOperations } from '@/icp/AesOperations';
import { useLastPath } from './useLastPath';
import { getStorage } from '@/storage/platformStorage';
import { setupAppKey, retrieveAppKey } from '@/icp/appKeyUtils';
import { retrieveValidDelegation, saveDelegation } from '@/icp/delegationUtils';
import { identityFromDelegation } from '@/icp/identityUtils';
// Create a single instance of AesOperations to be used across the app
const aesOperations = new AesOperations();

export function useAuth() {
  const [baseKey, setBaseKey] = useState<Ed25519KeyIdentity | undefined>(
    undefined,
  );
  const [isReady, setIsReady] = useState(false);
  const url = useURL();
  console.log('url', url);
  const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
    undefined,
  );
  const [authError, setAuthError] = useState<unknown | undefined>(undefined);
  // Use our new path management hook
  const { saveCurrentPath, lastPath, clearLastPath } = useLastPath();

  // Initialize auth state
  useEffect(() => {
    if (isReady) {
      console.log('skipping first useEffect');
      return;
    }

    if (identity) {
      console.log('skipping first useEffect because identity is already set');
      return;
    }

    (async () => {
      // if (Platform.OS === 'web') {
      //   const authClient = await AuthClient.create();
      //   setAuthClient(authClient);
      //   const authenticated = await authClient.isAuthenticated();
      //   console.log('authenticated', authenticated);

      //   if (authenticated) {
      //     const identity = authClient.getIdentity() as DelegationIdentity;
      //     setIdentity(identity);
      //     console.log('identity set from authClient');
      //   }

      //   setIsReady(true);
      //   return;
      // }

      // const storedBaseKey = await SecureStore.getItemAsync('baseKey');
      try {
        const appKey = await setupAppKey();
        const delegation = await retrieveValidDelegation();

        if (appKey && delegation) {
          const identity = DelegationIdentity.fromDelegation(
            appKey,
            delegation,
          );
          setIdentity(identity);
        }
      } catch (error) {
        setAuthError(error);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  // Handle URL changes for login callback
  useEffect(() => {
    if (identity || !url) {
      return;
    }

    console.log('URL changed:', url);
    const search = new URLSearchParams(url?.split('?')[1]);
    const delegation = search.get('delegation');
    console.log('Delegation from URL:', delegation ? 'present' : 'not present');

    if (delegation) {
      (async () => {
        try {
          console.log('Processing delegation from URL');
          const delegationChain = await saveDelegation(delegation);
          const id = await identityFromDelegation(delegationChain);
          setIdentity(id);
          console.log('identity set from delegation');

          WebBrowser.dismissBrowser();
        } catch (error) {
          console.error('Error in delegation processing:', error);
        }
      })();
    }
  }, [url]);

  const login = async () => {
    try {
      console.log('Logging in');
      // Save the current path before login
      saveCurrentPath();

      // if (Platform.OS === 'web') {
      //   if (!authClient) {
      //     throw new Error('Auth client not initialized');
      //   }

      //   const iiUri = getInternetIdentityURL();
      //   await authClient.login({
      //     identityProvider: iiUri,
      //     onSuccess: () => {
      //       const identity = authClient.getIdentity() as DelegationIdentity;
      //       setIdentity(identity);
      //       console.log('identity set from authClient');
      //     },
      //   });
      //   return;
      // }

      const redirectUri = createURL('/');
      console.log('redirectUri', redirectUri);

      const appKey = await retrieveAppKey();
      const pubkey = toHex(appKey.getPublicKey().toDer());

      const iiUri = getInternetIdentityURL();
      console.log('iiUri', iiUri);
      const iiIntegrationURL = getCanisterURL(
        ENV_VARS.CANISTER_ID_II_INTEGRATION,
      );
      const url = new URL(iiIntegrationURL);

      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('pubkey', pubkey);
      url.searchParams.set('ii_uri', iiUri);

      await WebBrowser.openBrowserAsync(url.toString());
    } catch (error) {
      setAuthError(error);
    }
  };

  const logout = async () => {
    console.log('Logging out');
    try {
      saveCurrentPath();
      const storage = await getStorage();
      // if (Platform.OS === 'web') {
      //   if (!authClient) {
      //     throw new Error('Auth client not initialized');
      //   }

      //   await authClient.logout();
      //   setIdentity(undefined);
      //   console.log('identity set to undefined after logout for web');
      //   return;
      // }

      //await AsyncStorage.removeItem('delegation');
      await storage.removeFromStorage('delegation');
      setIdentity(undefined);
      console.log('identity set to undefined after logout for native');
    } catch (error) {
      setAuthError(error);
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
    lastPath,
    saveCurrentPath,
    clearLastPath,
    authError,
  };
}
