import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { DelegationIdentity } from '@dfinity/identity';
import { getInternetIdentityURL } from '@/icp/getInternetIdentityURL';

export const useWebAuth = () => {
  const [authClient, setAuthClient] = useState<AuthClient | undefined>(
    undefined,
  );
  const [isReady, setIsReady] = useState(false);
  const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
    undefined,
  );

  useEffect(() => {
    (async () => {
      const authClient = await AuthClient.create();
      setAuthClient(authClient);

      setIsReady(true);
    })();
  }, []);

  const login = async () => {
    if (!authClient) {
      throw new Error('Auth client not initialized');
    }

    const iiUri = getInternetIdentityURL();
    await authClient.login({
      identityProvider: iiUri,
      onSuccess: () => {
        setIdentity(authClient.getIdentity() as DelegationIdentity);
      },
    });
  };

  // Clear identity on logout
  const logout = async () => {
    if (!authClient) {
      throw new Error('Auth client not initialized');
    }
    await authClient.logout();
    setIdentity(undefined);
  };

  return {
    identity,
    isReady,
    login,
    logout,
  };
};
