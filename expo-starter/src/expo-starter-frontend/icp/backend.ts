import { ENV_VARS } from '@/icp/env.generated';
import { createActor } from '@/icp/createActor';
import { idlFactory, _SERVICE } from '@/icp/expo-starter-backend.did';
import { Identity, ActorSubclass } from '@dfinity/agent';

export const createBackend = (
  identity: Identity | undefined,
): ActorSubclass<_SERVICE> => {
  return createActor<_SERVICE>({
    canisterId: ENV_VARS.CANISTER_ID_EXPO_STARTER_BACKEND,
    interfaceFactory: idlFactory,
    identity,
  });
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
