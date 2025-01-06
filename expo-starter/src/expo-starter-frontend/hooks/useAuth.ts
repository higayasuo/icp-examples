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
import { router } from 'expo-router';

/**
 * Save a value to secure storage
 * @param key - The key to store the value under
 * @param value - The value to store
 */
// async function save(key: string, value: string): Promise<void> {
//   await SecureStore.setItemAsync(key, value);
// }

export function useAuth() {
  const [baseKey, setBaseKey] = useState<Ed25519KeyIdentity | undefined>(
    undefined,
  );
  const [isReady, setIsReady] = useState(false);
  const url = useURL();
  /**
   * @type {[DelegationIdentity | undefined, React.Dispatch<React.SetStateAction<DelegationIdentity | undefined>>]} state
   */
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
    // If we have an identity or no baseKey, we don't need to do anything
    if (identity || !baseKey || !url) {
      return;
    }

    const search = new URLSearchParams(url?.split('?')[1]);
    const delegation = search.get('delegation');

    if (delegation) {
      console.log('delegation:', delegation);
      const chain = DelegationChain.fromJSON(
        JSON.parse(decodeURIComponent(delegation)),
      );
      AsyncStorage.setItem('delegation', JSON.stringify(chain.toJSON()));
      const id = DelegationIdentity.fromDelegation(baseKey, chain);
      setIdentity(id);

      WebBrowser.dismissBrowser();
      router.replace('/');
    }
  }, [url, baseKey, identity]);

  // Function to handle login and update identity based on base key
  const login = async () => {
    if (!baseKey) {
      console.log('No base key');
      return;
    }

    const derKey = toHex(baseKey.getPublicKey().toDer());
    //const url = new URL("https://tdpaj-biaaa-aaaab-qaijq-cai.icp0.io/");
    const iiIntegrationURL = getCanisterURL(
      ENV_VARS.CANISTER_ID_II_INTEGRATION,
    );
    console.log('iiIntegrationURL:', iiIntegrationURL);
    const url = new URL(iiIntegrationURL);

    // Get the appropriate URI based on the environment
    const redirectUri = createURL('/redirect');
    console.log('redirectUri:', redirectUri);

    url.searchParams.set('redirect_uri', encodeURIComponent(redirectUri));

    url.searchParams.set('pubkey', derKey);
    return await WebBrowser.openBrowserAsync(url.toString());
  };

  // Clear identity on logout
  const logout = async () => {
    setIdentity(undefined);
    await AsyncStorage.removeItem('delegation');
  };

  return {
    baseKey,
    setBaseKey,
    identity,
    isReady,
    login,
    logout,
  };
}
