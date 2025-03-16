import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [isProcessingAes, setIsProcessingAes] = useState(true);
  const [aesError, setAesError] = useState<unknown | undefined>(undefined);
  const isInitializedRef = useRef(false);
  const lastProcessedIdentityRef = useRef<Identity | undefined>(undefined);

  // Reset state when identity changes
  useEffect(() => {
    if (identity !== lastProcessedIdentityRef.current) {
      setIsProcessingAes(true);
      isInitializedRef.current = false;
    }
  }, [identity]);

  // Initialize AES key
  useEffect(() => {
    // Skip if already initialized with this identity
    if (
      isInitializedRef.current &&
      lastProcessedIdentityRef.current === identity
    ) {
      setIsProcessingAes(false);
      return;
    }

    let isMounted = true;

    const initAes = async () => {
      try {
        setAesError(undefined);

        if (!identity) {
          try {
            await generateAesRawKey();
            isInitializedRef.current = true;
            lastProcessedIdentityRef.current = identity;
          } catch (err) {
            console.error('Error generating AES key:', err);
            if (isMounted) setAesError(err);
          }
          if (isMounted) setIsProcessingAes(false);
          return;
        }

        const tskSeed = platformCrypto.getRandomBytes(32);
        const tsk = new TransportSecretKey(tskSeed);
        const backend = await createBackend(identity);
        const principal = identity.getPrincipal().toUint8Array();

        const { publicKey, encryptedAesKey, encryptedKey } =
          await asymmetricKeys({
            backend,
            transportPublicKey: tsk.public_key(),
          });

        try {
          const newEncryptedAesKey = await initAesKeyInternal({
            publicKey,
            encryptedAesKey,
            encryptedKey,
            principal,
            tsk,
          });

          if (newEncryptedAesKey) {
            await backend.asymmetric_save_encrypted_aes_key(newEncryptedAesKey);
          }

          isInitializedRef.current = true;
          lastProcessedIdentityRef.current = identity;
        } catch (err) {
          console.error('Error calling initAesKeyInternal:', err);
          if (isMounted) setAesError(err);
        }
      } catch (err) {
        console.error('Failed to initialize AES key:', err);
        if (isMounted) setAesError(err);
      } finally {
        if (isMounted) setIsProcessingAes(false);
      }
    };

    initAes();

    return () => {
      isMounted = false;
    };
  }, [identity]);

  return {
    isProcessingAes,
    aesError,
  };
};
