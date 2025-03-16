import { ENV_VARS } from '@/constants/env.generated';
import { idlFactory, _SERVICE } from '@/icp/expo-starter-backend.did';
import { Identity, ActorSubclass } from '@dfinity/agent';
import { LOCAL_IP_ADDRESS } from '../constants';
import { CanisterManager } from 'canister-manager';

export const createBackend = (
  identity: Identity | undefined,
): ActorSubclass<_SERVICE> => {
  const canisterManager = new CanisterManager({
    dfxNetwork: ENV_VARS.DFX_NETWORK,
    localIPAddress: LOCAL_IP_ADDRESS,
  });
  return canisterManager.createActor<_SERVICE>({
    canisterId: ENV_VARS.CANISTER_ID_EXPO_STARTER_BACKEND,
    interfaceFactory: idlFactory,
    identity,
  });
  // const canisterUrl = canisterManager.getBackendCanisterURL(
  //   ENV_VARS.CANISTER_ID_EXPO_STARTER_BACKEND,
  // );

  // return createActor<_SERVICE>({
  //   canisterUrl,
  //   canisterId: ENV_VARS.CANISTER_ID_EXPO_STARTER_BACKEND,
  //   dfxNetwork: ENV_VARS.DFX_NETWORK,
  //   interfaceFactory: idlFactory,
  //   identity,
  // });
};

type AsymmetricKeysArgs = {
  backend: ActorSubclass<_SERVICE>;
  transportPublicKey: Uint8Array;
};

type AsymmetricKeysReply = {
  publicKey: Uint8Array;
  encryptedAesKey: Uint8Array | undefined;
  encryptedKey: Uint8Array | undefined;
};

export const asymmetricKeys = async ({
  backend,
  transportPublicKey,
}: AsymmetricKeysArgs): Promise<AsymmetricKeysReply> => {
  const keysReply = await backend.asymmetric_keys(transportPublicKey);

  const publicKey = keysReply.public_key as Uint8Array;
  const encryptedAesKey = keysReply.encrypted_aes_key?.[0] as
    | Uint8Array
    | undefined;
  const encryptedKey = keysReply.encrypted_key?.[0] as Uint8Array | undefined;

  return {
    publicKey,
    encryptedAesKey,
    encryptedKey,
  };
};
