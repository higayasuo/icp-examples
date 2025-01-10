import { ENV_VARS } from '@/icp/env.generated';
import { useAuth } from './useAuth';
import { createActor } from '@/icp/createActor';
import { idlFactory, _SERVICE } from '@/icp/expo-starter-backend.did';
import { useEffect, useState } from 'react';
import { ActorSubclass } from '@dfinity/agent';

export const useBackend = () => {
  const { identity } = useAuth();
  const [backend, setBackend] = useState<ActorSubclass<_SERVICE> | undefined>(
    undefined,
  );

  useEffect(() => {
    const backend = identity
      ? createActor<_SERVICE>({
          canisterId: ENV_VARS.CANISTER_ID_EXPO_STARTER_BACKEND,
          interfaceFactory: idlFactory,
          identity,
        })
      : undefined;

    setBackend(backend);
  }, [identity]);

  return { backend };
};
