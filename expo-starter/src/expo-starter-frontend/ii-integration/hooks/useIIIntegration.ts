import { useState, useEffect, useRef, useCallback } from 'react';
import { toHex } from '@dfinity/agent';
import { DelegationIdentity } from '@dfinity/identity';
import * as WebBrowser from 'expo-web-browser';
import { useURL, createURL } from 'expo-linking';
import { usePathname } from 'expo-router';
import { Platform } from 'react-native';

import { CanisterManager } from 'canister-manager';

import { getAppKey, findAppKey, generateAppKey } from '../storage/appKeyUtils';
import {
  findValidDelegation,
  saveDelegation,
  removeDelegation,
} from '../storage/delegationUtils';
import { identityFromDelegation } from '../storage/identityUtils';

export type UseIIAuthParams = {
  localIPAddress: string;
  dfxNetwork: string;
  iiIntegrationCanisterId: string;
  iiCanisterId: string;
};

export function useIIIntegration({
  localIPAddress,
  dfxNetwork,
  iiIntegrationCanisterId,
  iiCanisterId,
}: UseIIAuthParams) {
  const [isReady, setIsReady] = useState(false);
  const url = useURL();
  const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
    undefined,
  );
  const [authError, setAuthError] = useState<unknown | undefined>(undefined);

  // Login path management
  const currentPath = usePathname();
  const pathWhenLoginRef = useRef<string | undefined>(undefined);

  const savePathWhenLogin = useCallback(() => {
    console.log('Saving path when login:', currentPath);
    if (!currentPath) return;
    pathWhenLoginRef.current = currentPath;
  }, [currentPath]);

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
        const appKey = await findAppKey();
        const delegation = await findValidDelegation();

        if (appKey && delegation) {
          const identity = DelegationIdentity.fromDelegation(
            appKey,
            delegation,
          );
          setIdentity(identity);
        } else if (!appKey) {
          await generateAppKey();
          await removeDelegation();
        }
      } catch (error) {
        setAuthError(error);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setupIdentityFromDelegation = async (delegation: string) => {
    console.log('Processing delegation');
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
      savePathWhenLogin();

      const redirectUri = createURL('/');
      console.log('redirectUri', redirectUri);

      const appKey = await getAppKey();
      const pubkey = toHex(appKey.getPublicKey().toDer());

      const canisterManager = new CanisterManager({
        dfxNetwork,
        localIPAddress,
      });

      const iiUri = canisterManager.getInternetIdentityURL(iiCanisterId);
      console.log('iiUri', iiUri);

      const iiIntegrationURL = canisterManager.getFrontendCanisterURL(
        iiIntegrationCanisterId,
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
      await removeDelegation();
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
    pathWhenLogin: pathWhenLoginRef.current,
    authError,
  };
}
