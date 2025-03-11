import { DelegationIdentity } from '@dfinity/identity';
import { createBackend, asymmetricKeys } from './backend';
import {
  generateAesRawKey,
  removeAesRawKey,
  saveAesRawKey,
} from './aesRawKeyUtils';
import { platformCrypto } from 'expo-crypto-universal';
import {
  TransportSecretKey,
  ibeDecrypt,
  ibeEncrypt,
} from 'vetkeys-client-utils';

/**
 * Initializes or retrieves an AES key for encryption/decryption
 * If no identity exists, generates a new AES key
 * If identity exists but no encrypted key exists, generates and encrypts a new AES key
 * If identity and encrypted key exist, decrypts the existing AES key
 * @param identity - The user's DelegationIdentity, if available
 */
export const initAesKeyInternal = async (
  identity: DelegationIdentity | undefined,
) => {
  const totalStartTime = performance.now();

  if (!identity) {
    console.log('No identity found, generating new AES key');
    await generateAesRawKey();
    return;
  }

  await removeAesRawKey();

  const backend = createBackend(identity);
  const backendCallStartTime = performance.now();
  const tskSeed = platformCrypto.getRandomBytes(32);
  const tsk = new TransportSecretKey(tskSeed);
  const { publicKey, encryptedAesKey, encryptedKey } = await asymmetricKeys({
    backend,
    transportPublicKey: tsk.public_key(),
  });
  console.log(
    `Backend asymmetric_keys call took: ${
      performance.now() - backendCallStartTime
    }ms`,
  );

  const principal = identity.getPrincipal();
  // Convert Principal to Uint8Array
  const principalBytes = principal.toUint8Array();

  if (encryptedAesKey && encryptedKey) {
    console.log('Decrypting existing AES key');
    const decryptStartTime = performance.now();
    const aesRawKey = await ibeDecrypt({
      ciphertext: encryptedAesKey,
      principal: principal.toUint8Array(),
      encryptedKey,
      publicKey,
      tsk,
    });
    await saveAesRawKey(aesRawKey);
    // await aesOperations.decryptExistingAesKey({
    //   encryptedAesKey,
    //   encryptedKey,
    //   publicKey,
    //   principal: principal.toUint8Array(),
    // });
    console.log(
      `Decrypting existing AES key took: ${
        performance.now() - decryptStartTime
      }ms`,
    );
  } else {
    console.log('Generating and encrypting new AES key');
    const generateStartTime = performance.now();
    const aesRawKey = await generateAesRawKey();
    const seed = platformCrypto.getRandomBytes(32);
    const encryptedAesRawKey = await ibeEncrypt({
      data: aesRawKey,
      principal: principal.toUint8Array(),
      publicKey,
      seed,
    });
    // const newEncryptedAesKey = await aesOperations.generateAndEncryptAesKey(
    //   publicKey,
    //   principalBytes,
    // );
    console.log(
      `Generating and encrypting new AES key took: ${
        performance.now() - generateStartTime
      }ms`,
    );

    console.log('Saving new encrypted AES key');
    const saveStartTime = performance.now();
    await backend.asymmetric_save_encrypted_aes_key(encryptedAesRawKey);
    console.log(
      `Saving encrypted AES key took: ${performance.now() - saveStartTime}ms`,
    );
  }

  console.log(
    `Total initialization process took: ${
      performance.now() - totalStartTime
    }ms`,
  );
};
