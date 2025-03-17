import { useEffect, useRef, useState, useCallback } from 'react';
import { initAesKeyInternal } from './initAesKeyInternal';
import { Identity } from '@dfinity/agent';
import { TransportSecretKey } from 'vetkeys-client-utils';
import { platformCrypto } from 'expo-crypto-universal';
import { generateAesRawKey } from '../storage/aesRawKeyUtils';

export type AsymmetricKeysResult = {
  publicKey: Uint8Array;
  encryptedAesKey: Uint8Array | undefined;
  encryptedKey: Uint8Array | undefined;
};

export interface AesBackend {
  asymmetricKeys: (
    transportPublicKey: Uint8Array,
  ) => Promise<AsymmetricKeysResult>;

  asymmetricSaveEncryptedAesKey: (encryptedAesKey: Uint8Array) => Promise<void>;
}

type UseAesKeyArgs = {
  identity: Identity | undefined;
  backend: AesBackend;
};

export const useAesKey = ({ identity, backend }: UseAesKeyArgs) => {
  const [isProcessingAes, setIsProcessingAes] = useState(false);
  const aesErrorRef = useRef<unknown | undefined>(undefined);

  const initAesKey = useCallback(async () => {
    try {
      aesErrorRef.current = undefined;
      setIsProcessingAes(true);

      if (!identity) {
        console.log('Generating AES key');
        await generateAesRawKey();
        return;
      }

      const tskSeed = platformCrypto.getRandomBytes(32);
      const tsk = new TransportSecretKey(tskSeed);
      const principal = identity.getPrincipal().toUint8Array();
      console.log('Getting asymmetric keys');
      const asymmetricKeysStartTime = performance.now();
      const { publicKey, encryptedAesKey, encryptedKey } =
        await backend.asymmetricKeys(tsk.public_key());
      console.log(
        `Getting asymmetric keys took: ${
          performance.now() - asymmetricKeysStartTime
        }ms`,
      );

      const newEncryptedAesKey = await initAesKeyInternal({
        publicKey,
        encryptedAesKey,
        encryptedKey,
        principal,
        tsk,
      });

      if (newEncryptedAesKey) {
        console.log('Saving AES key to backend');
        const saveEncryptedAesKeyStartTime = performance.now();
        await backend.asymmetricSaveEncryptedAesKey(newEncryptedAesKey);
        console.log(
          `Saving AES key to backend took: ${
            performance.now() - saveEncryptedAesKeyStartTime
          }ms`,
        );
      }
    } catch (err) {
      console.error('Failed to initialize AES key:', err);
      aesErrorRef.current = err;
    } finally {
      setIsProcessingAes(false);
    }
  }, [identity]);

  // Initialize on first load and when identity changes
  useEffect(() => {
    initAesKey();
  }, [identity, initAesKey]);

  return {
    isProcessingAes,
    aesError: aesErrorRef.current,
  };
};
