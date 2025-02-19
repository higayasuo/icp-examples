import { Principal } from '@dfinity/principal';
import * as vetkd from 'ic-vetkd-utils';
import { fromHex } from './hex';

export interface IBEEncryptParams {
  plaintext: string;
  principal: Principal;
  publicKey: string;
  seed: Uint8Array;
}

/**
 * Encrypts a message using Identity-Based Encryption (IBE).
 * @param {IBEEncryptParams} params - The parameters for IBE encryption.
 * @returns {Promise<Uint8Array>} The encrypted data.
 */
export const ibeEncrypt = async ({
  plaintext,
  principal,
  publicKey,
  seed,
}: IBEEncryptParams): Promise<Uint8Array> => {
  const principalBytes = principal.toUint8Array();
  const pkBytes = fromHex(publicKey);
  const messageBytes = new TextEncoder().encode(plaintext);

  const ciphertext = vetkd.IBECiphertext.encrypt(
    pkBytes,
    principalBytes,
    messageBytes,
    seed,
  );
  return ciphertext.serialize();
};
