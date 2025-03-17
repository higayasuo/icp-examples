import { useEffect, useRef, useState, useCallback } from 'react';
import { initAesKeyInternal } from './initAesKeyInternal';
import { Identity } from '@dfinity/agent';
import { createBackend, asymmetricKeys } from '@/icp/backend';
import { TransportSecretKey } from 'vetkeys-client-utils';
import { platformCrypto } from 'expo-crypto-universal';
import { generateAesRawKey } from '../storage/aesRawKeyUtils';

type UseAesKeyArgs = {
  identity: Identity | undefined;
};

export const useAesKey = ({ identity }: UseAesKeyArgs) => {
  const [isProcessingAes, setIsProcessingAes] = useState(false);
  const aesErrorRef = useRef<unknown | undefined>(undefined);
  const isProcessingAesRef = useRef(false);

  const initAesKey = useCallback(async () => {
    // Don't run if already loading
    if (isProcessingAesRef.current) {
      console.log('Skipping because already processing');
      return;
    }

    try {
      aesErrorRef.current = undefined;
      isProcessingAesRef.current = true;
      setIsProcessingAes(true);

      if (!identity) {
        console.log('Generating AES key');
        await generateAesRawKey();
        return;
      }

      const tskSeed = platformCrypto.getRandomBytes(32);
      const tsk = new TransportSecretKey(tskSeed);
      const backend = await createBackend(identity);
      const principal = identity.getPrincipal().toUint8Array();
      console.log('Getting asymmetric keys');
      const asymmetricKeysStartTime = performance.now();
      const { publicKey, encryptedAesKey, encryptedKey } = await asymmetricKeys(
        {
          backend,
          transportPublicKey: tsk.public_key(),
        },
      );
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
        await backend.asymmetric_save_encrypted_aes_key(newEncryptedAesKey);
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
      isProcessingAesRef.current = false;
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
