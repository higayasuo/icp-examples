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
import { IIIntegrationClient } from '@/icp/IIIntegrationClient';
import { Platform } from 'react-native';
// Create a single instance of AesOperations to be used across the app
const aesOperations = new AesOperations();
const iiIntegrationClient = new IIIntegrationClient();

export function useAuth() {
  const [isReady, setIsReady] = useState(false);
  const url = useURL();
  const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
    undefined,
  );
  const [authError, setAuthError] = useState<unknown | undefined>(undefined);
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

  const setupIdentityFromDelegation = async (delegation: string) => {
    console.log('Processing delegation from URL');
    const delegationChain = await saveDelegation(delegation);
    const id = await identityFromDelegation(delegationChain);
    setIdentity(id);
    console.log('identity set from delegation');
  };

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
          await setupIdentityFromDelegation(delegation);

          WebBrowser.dismissBrowser();
        } catch (error) {
          setAuthError(error);
        }
      })();
    }
  }, [url]);

  const login = async () => {
    try {
      console.log('Logging in');
      // Save the current path before login
      saveCurrentPath();

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

      if (Platform.OS === 'web') {
        iiIntegrationClient.on('success', (response) => {
          console.log('IIIntegration success');
          setupIdentityFromDelegation(response.delegation);
          iiIntegrationClient.close();
        });
        await iiIntegrationClient.open({ url: url.toString() });
      } else {
        await WebBrowser.openBrowserAsync(url.toString());
      }
    } catch (error) {
      setAuthError(error);
    }
  };

  const logout = async () => {
    console.log('Logging out');
    try {
      saveCurrentPath();
      const storage = await getStorage();
      await storage.removeFromStorage('delegation');
      setIdentity(undefined);
      console.log('identity set to undefined after logout');
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
