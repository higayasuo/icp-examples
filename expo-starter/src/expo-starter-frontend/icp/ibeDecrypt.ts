import { Principal } from '@dfinity/principal';
import * as vetkd from 'ic-vetkd-utils';
import { fromHex } from './hex';

export interface IBEDecryptParams {
  ciphertext: string;
  principal: Principal;
  encryptedKey: string;
  publicKey: string;
  tsk: vetkd.TransportSecretKey;
}

/**
 * Create transport secret key from seed
 * @param {Uint8Array} tskSeed - The 32-byte random seed for transport secret key.
 * @returns {vetkd.TransportSecretKey} The transport secret key instance.
 */
export const createTransportSecretKey = (
  tskSeed: Uint8Array,
): vetkd.TransportSecretKey => {
  return new vetkd.TransportSecretKey(tskSeed);
};

/**
 * Get public key for transport secret key
 * @param {vetkd.TransportSecretKey} tsk - The transport secret key instance.
 * @returns {Uint8Array} The public key for transport secret key.
 */
export const getTransportPublicKey = (
  tsk: vetkd.TransportSecretKey,
): Uint8Array => {
  return tsk.public_key();
};

/**
 * Decrypts a message using Identity-Based Encryption (IBE).
 * @param {IBEDecryptParams} params - The parameters for IBE decryption.
 * @returns {Promise<string>} The decrypted text.
 */
export const ibeDecrypt = async ({
  ciphertext,
  principal,
  encryptedKey,
  publicKey,
  tsk,
}: IBEDecryptParams): Promise<string> => {
  const ekBytes = fromHex(encryptedKey);
  const pkBytes = fromHex(publicKey);
  const principalBytes = principal.toUint8Array();

  const keyBytes = tsk.decrypt(ekBytes, pkBytes, principalBytes);
  const ciphertextObj = vetkd.IBECiphertext.deserialize(fromHex(ciphertext));
  const decryptedBytes = ciphertextObj.decrypt(keyBytes);
  return new TextDecoder().decode(decryptedBytes);
};
