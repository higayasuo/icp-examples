import { Principal } from '@dfinity/principal';
import * as vetkd from 'ic-vetkd-utils-wasm2js';

export interface IBEEncryptParams {
  data: Uint8Array;
  principal: Principal;
  publicKey: Uint8Array;
  seed: Uint8Array;
}

/**
 * Encrypts a message using Identity-Based Encryption (IBE).
 * @param {IBEEncryptParams} params - The parameters for IBE encryption.
 * @returns {Promise<Uint8Array>} The encrypted data.
 */
export const ibeEncrypt = async ({
  data,
  principal,
  publicKey,
  seed,
}: IBEEncryptParams): Promise<Uint8Array> => {
  const principalBytes = principal.toUint8Array();

  const ciphertext = vetkd.IBECiphertext.encrypt(
    publicKey,
    principalBytes,
    data,
    seed,
  );
  return ciphertext.serialize();
};
