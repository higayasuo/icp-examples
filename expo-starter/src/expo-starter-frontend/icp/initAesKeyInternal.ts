import { DelegationIdentity } from '@dfinity/identity';
import { createBackend, asymmetricKeys } from './backend';
import { getAesOperationsInstance } from './aesOperationsInstance';

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
  const aesOperations = getAesOperationsInstance();
  const totalStartTime = performance.now();

  if (!identity) {
    console.log('No identity found, generating new AES key');
    await aesOperations.generateAesKey();
    return;
  }

  aesOperations.clearAesRawKey();

  const backend = createBackend(identity);
  const backendCallStartTime = performance.now();
  const { publicKey, encryptedAesKey, encryptedKey } = await asymmetricKeys({
    backend,
    transportPublicKey: aesOperations.transportPublicKey,
  });
  console.log(
    `Backend asymmetric_keys call took: ${
      performance.now() - backendCallStartTime
    }ms`,
  );

  const principal = identity.getPrincipal();

  if (encryptedAesKey && encryptedKey) {
    console.log('Decrypting existing AES key');
    const decryptStartTime = performance.now();
    await aesOperations.decryptExistingAesKey(
      encryptedAesKey,
      encryptedKey,
      publicKey,
      principal,
    );
    console.log(
      `Decrypting existing AES key took: ${
        performance.now() - decryptStartTime
      }ms`,
    );
  } else {
    console.log('Generating and encrypting new AES key');
    const generateStartTime = performance.now();
    const newEncryptedAesKey = await aesOperations.generateAndEncryptAesKey(
      publicKey,
      principal,
    );
    console.log(
      `Generating and encrypting new AES key took: ${
        performance.now() - generateStartTime
      }ms`,
    );

    console.log('Saving new encrypted AES key');
    const saveStartTime = performance.now();
    await backend.asymmetric_save_encrypted_aes_key(newEncryptedAesKey);
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
