import { Principal } from '@dfinity/principal';
import { TransportSecretKeyWrapper } from './TransportSecretKeyWrapper';

export interface CreateSymmetricKeyParams {
  seed: Uint8Array;
  encryptedKey: Uint8Array;
  publicKey: Uint8Array;
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
  purpose = 'aes-256-cbc-hmac-sha256',
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
