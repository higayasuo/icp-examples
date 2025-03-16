import {
  generateAesRawKey,
  removeAesRawKey,
  saveAesRawKey,
} from '../storage/aesRawKeyUtils';
import { platformCrypto } from 'expo-crypto-universal';
import {
  TransportSecretKey,
  ibeDecrypt,
  ibeEncrypt,
} from 'vetkeys-client-utils';

type InitAesKeyInternalArgs = {
  publicKey: Uint8Array;
  encryptedAesKey: Uint8Array | undefined;
  encryptedKey: Uint8Array | undefined;
  principal: Uint8Array;
  tsk: TransportSecretKey;
};

export const initAesKeyInternal = async ({
  publicKey,
  encryptedAesKey,
  encryptedKey,
  principal,
  tsk,
}: InitAesKeyInternalArgs): Promise<Uint8Array | undefined> => {
  try {
    await removeAesRawKey();

    if (encryptedAesKey && encryptedKey) {
      console.log('Decrypting existing AES key');
      const decryptStartTime = performance.now();
      const aesRawKey = await ibeDecrypt({
        ciphertext: encryptedAesKey,
        principal,
        encryptedKey,
        publicKey,
        tsk,
      });
      await saveAesRawKey(aesRawKey);
      console.log(
        `Decrypting existing AES key took: ${
          performance.now() - decryptStartTime
        }ms`,
      );
      return undefined;
    } else {
      console.log('Generating and encrypting new AES key');
      const generateStartTime = performance.now();
      const aesRawKey = await generateAesRawKey();
      const seed = platformCrypto.getRandomBytes(32);
      const encryptedAesRawKey = await ibeEncrypt({
        data: aesRawKey,
        principal,
        publicKey,
        seed,
      });
      console.log(
        `Generating and encrypting new AES key took: ${
          performance.now() - generateStartTime
        }ms`,
      );

      return encryptedAesRawKey;
    }
  } catch (error) {
    console.error('Error in initAesKeyInternal:', error);
    throw error;
  }
};
