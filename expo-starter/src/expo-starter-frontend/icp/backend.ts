import { ENV_VARS } from '@/icp/env.generated';
import { createActor } from '@/icp/createActor';
import { idlFactory, _SERVICE } from '@/icp/expo-starter-backend.did';
import { Identity } from '@dfinity/agent';

export const createBackend = (identity: Identity | undefined) => {
  return createActor<_SERVICE>({
    canisterId: ENV_VARS.CANISTER_ID_EXPO_STARTER_BACKEND,
    interfaceFactory: idlFactory,
    identity,
  });
};
