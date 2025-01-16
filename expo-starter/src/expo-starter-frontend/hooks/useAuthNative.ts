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

export const useNativeAuth = () => {
  const [baseKey, setBaseKey] = useState<Ed25519KeyIdentity | undefined>(
    undefined,
  );
  const [isReady, setIsReady] = useState(false);
  //const [isLoggingIn, setIsLoggingIn] = useState(false);
  const url = useURL();
  const pathname = usePathname();
  const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
    undefined,
  );

  useEffect(() => {
    (async () => {
      const storedKey = await SecureStore.getItemAsync('baseKey');

      if (storedKey) {
        const key = Ed25519KeyIdentity.fromJSON(storedKey);
        setBaseKey(key);
      } else {
        const key = Ed25519KeyIdentity.generate();
        setBaseKey(key);
        await SecureStore.setItemAsync('baseKey', JSON.stringify(key.toJSON()));
      }

      const storedDelegation = await AsyncStorage.getItem('delegation');

      if (storedDelegation && storedKey) {
        const chain = DelegationChain.fromJSON(JSON.parse(storedDelegation));
        if (isDelegationValid(chain)) {
          const key = Ed25519KeyIdentity.fromJSON(storedKey);
          const id = DelegationIdentity.fromDelegation(key, chain);
          setIdentity(id);
        } else {
          await AsyncStorage.removeItem('delegation');
        }
      }

      setIsReady(true);
    })();
  }, []);

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

      WebBrowser.dismissBrowser();

      // Get the stored path and navigate back to it
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

  // Function to handle login and update identity based on base key
  const login = async () => {
    if (!baseKey) {
      console.log('No base key');
      return;
    }

    // Store the current path before navigating to login
    await AsyncStorage.setItem('lastPath', pathname);

    const derKey = toHex(baseKey.getPublicKey().toDer());
    const iiIntegrationURL = getCanisterURL(
      ENV_VARS.CANISTER_ID_II_INTEGRATION,
    );
    const url = new URL(iiIntegrationURL);

    // Get the appropriate URI based on the environment
    const redirectUri = createURL('/');
    const iiUri = getInternetIdentityURL();

    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('pubkey', derKey);
    url.searchParams.set('ii_uri', iiUri);

    await WebBrowser.openBrowserAsync(url.toString());
  };

  // Clear identity on logout
  const logout = async () => {
    setIdentity(undefined);
    await AsyncStorage.removeItem('delegation');
  };

  return {
    identity,
    isReady,
    login,
    logout,
  };
};
