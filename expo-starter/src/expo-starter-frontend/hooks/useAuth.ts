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

  // Initialize auth state
  useEffect(() => {
    if (isReady) {
      console.log('skipping first useEffect');
      return;
    }

    (async () => {
      const storedBaseKey = await SecureStore.getItemAsync('baseKey');
      const storedDelegation = await AsyncStorage.getItem('delegation');

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

      if (!identity && storedBaseKey && storedDelegation) {
        const delegationChain = DelegationChain.fromJSON(
          JSON.parse(storedDelegation),
        );

        if (isDelegationValid(delegationChain)) {
          const baseKey = Ed25519KeyIdentity.fromJSON(storedBaseKey);
          const id = DelegationIdentity.fromDelegation(
            baseKey,
            delegationChain,
          );
          console.log('Setting identity from baseKey and delegation');
          setIdentity(id);
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
      console.log('delegation exists in URL');
      const chain = DelegationChain.fromJSON(JSON.parse(delegation));
      AsyncStorage.setItem('delegation', JSON.stringify(chain.toJSON()));
      const id = DelegationIdentity.fromDelegation(baseKey, chain);
      setIdentity(id);
      console.log('set identity from delegation');
      WebBrowser.dismissBrowser();

      AsyncStorage.getItem('lastPath').then((path) => {
        if (path) {
          navigate(path);
          AsyncStorage.removeItem('lastPath');
        } else {
          router.replace('/');
        }
      });
    }
  }, [url, baseKey]);

  const login = async () => {
    if (!baseKey) {
      throw new Error('No base key');
    }

    await AsyncStorage.setItem('lastPath', pathname);

    const derKey = toHex(baseKey.getPublicKey().toDer());
    const iiIntegrationURL = getCanisterURL(
      ENV_VARS.CANISTER_ID_II_INTEGRATION,
    );
    const url = new URL(iiIntegrationURL);
    const redirectUri = createURL('/');
    const iiUri = getInternetIdentityURL();

    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('pubkey', derKey);
    url.searchParams.set('ii_uri', iiUri);

    await WebBrowser.openBrowserAsync(url.toString());
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('delegation');
      setIdentity(undefined);
      console.log('identity set to undefined after logout');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return {
    identity,
    isReady,
    login,
    logout,
  };
}
