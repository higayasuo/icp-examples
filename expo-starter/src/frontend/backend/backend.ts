import { ENV_VARS } from '@/constants/env.generated';
import { idlFactory, _SERVICE } from './backend.did';
import { Identity, ActorSubclass } from '@dfinity/agent';
import { LOCAL_IP_ADDRESS } from '../constants';
import { CanisterManager } from 'canister-manager';
import { AesBackend, AsymmetricKeysResult } from 'expo-aes-vetkeys';

export const createAesBackend = (
  identity: Identity | undefined,
): AesBackend => {
  const backend = createBackend(identity);
  return wrapAesBackend(backend);
};

export const createBackend = (
  identity: Identity | undefined,
): ActorSubclass<_SERVICE> => {
  const canisterManager = new CanisterManager({
    dfxNetwork: ENV_VARS.DFX_NETWORK,
    localIPAddress: LOCAL_IP_ADDRESS,
  });
  return canisterManager.createActor<_SERVICE>({
    canisterId: ENV_VARS.CANISTER_ID_BACKEND,
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

export const wrapAesBackend = (
  backend: ActorSubclass<_SERVICE>,
): AesBackend => {
  return {
    asymmetricKeys: async (transportPublicKey) => {
      return asymmetricKeys({ backend, transportPublicKey });
    },
    asymmetricSaveEncryptedAesKey: async (encryptedAesKey) => {
      await backend.asymmetric_save_encrypted_aes_key(encryptedAesKey);
    },
  };
};

type AsymmetricKeysArgs = {
  backend: ActorSubclass<_SERVICE>;
  transportPublicKey: Uint8Array;
};

export const asymmetricKeys = async ({
  backend,
  transportPublicKey,
}: AsymmetricKeysArgs): Promise<AsymmetricKeysResult> => {
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
