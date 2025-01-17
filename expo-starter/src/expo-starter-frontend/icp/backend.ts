import { ENV_VARS } from '@/icp/env.generated';
import { createActor } from '@/icp/createActor';
import { idlFactory, _SERVICE } from '@/icp/expo-starter-backend.did';
import { DelegationIdentity } from '@dfinity/identity';

export const createBackend = (identity: DelegationIdentity) => {
  return createActor<_SERVICE>({
    canisterId: ENV_VARS.CANISTER_ID_EXPO_STARTER_BACKEND,
    interfaceFactory: idlFactory,
    identity,
  });
};
