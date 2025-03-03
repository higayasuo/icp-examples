import { useAuth } from '@/hooks/useAuth';
import { createBackend, asymmetricKeys } from './backend';

type Auth = ReturnType<typeof useAuth>;

/**
 * Initializes or retrieves an AES key for encryption/decryption
 * If no identity exists, generates a new AES key
 * If identity exists but no encrypted key exists, generates and encrypts a new AES key
 * If identity and encrypted key exist, decrypts the existing AES key
 * @param auth - Auth object containing identity and key management functions
 */
export const initAesKeyInternal = async (auth: Auth) => {
  const {
    identity,
    generateAesKey,
    clearAesRawKey,
    decryptExistingAesKey,
    generateAndEncryptAesKey,
    transportPublicKey,
  } = auth;

  const totalStartTime = performance.now();

  if (!identity) {
    console.log('No identity found, generating new AES key');
    await generateAesKey();
    return;
  }

  clearAesRawKey();

  const backend = createBackend(identity);
  const backendCallStartTime = performance.now();
  const { publicKey, encryptedAesKey, encryptedKey } = await asymmetricKeys({
    backend,
    transportPublicKey,
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
    await decryptExistingAesKey(
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
    const newEncryptedAesKey = await generateAndEncryptAesKey(
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

  //initializationCompleted.current = true;
  console.log(
    `Total initialization process took: ${
      performance.now() - totalStartTime
    }ms`,
  );
};
