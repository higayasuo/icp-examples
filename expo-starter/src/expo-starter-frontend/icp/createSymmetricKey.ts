import { Principal } from '@dfinity/principal';
import { TransportSecretKeyWrapper } from './TransportSecretKeyWrapper';

export interface CreateSymmetricKeyParams {
  seed: Uint8Array;
  encryptedKey: string;
  publicKey: string;
  principal: Principal;
  keyLength?: number;
  purpose?: string;
}

/**
 * Create a symmetric key using Identity-Based Encryption
 * @param {CreateSymmetricKeyParams} params - The parameters for symmetric key creation
 * @returns {Uint8Array} The symmetric key
 */
export const createSymmetricKey = ({
  seed,
  encryptedKey,
  publicKey,
  principal,
  keyLength = 32,
  purpose = 'aes-256-gcm',
}: CreateSymmetricKeyParams): Uint8Array => {
  const tsk = new TransportSecretKeyWrapper(seed);
  return tsk.decryptAndHash({
    encryptedKey,
    publicKey,
    principal,
    keyLength,
    purpose,
  });
};
