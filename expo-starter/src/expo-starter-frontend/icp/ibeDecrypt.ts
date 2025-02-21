import { Principal } from '@dfinity/principal';
import * as vetkd from 'ic-vetkd-utils';
import { TransportSecretKeyWrapper } from './TransportSecretKeyWrapper';
import { fromHex } from './hex';

// 外部に公開する型は vetkd に依存しない
export interface TSK {
  getPublicKey(): Uint8Array;
  decrypt(
    encryptedKey: Uint8Array,
    publicKey: Uint8Array,
    principal: Principal,
  ): Uint8Array;
}

export interface IBEDecryptParams {
  ciphertext: Uint8Array;
  principal: Principal;
  encryptedKey: Uint8Array;
  publicKey: Uint8Array;
  tsk: TransportSecretKeyWrapper;
}

/**
 * Create transport secret key from seed
 * @param {Uint8Array} tskSeed - The 32-byte random seed for transport secret key.
 * @returns {TransportSecretKeyWrapper} The transport secret key wrapper instance.
 */
export const createTransportSecretKey = (
  tskSeed: Uint8Array,
): TransportSecretKeyWrapper => {
  return new TransportSecretKeyWrapper(tskSeed);
};

/**
 * Decrypts a message using Identity-Based Encryption (IBE).
 * @param {IBEDecryptParams} params - The parameters for IBE decryption.
 * @returns {Promise<Uint8Array>} The decrypted data.
 */
export const ibeDecrypt = async ({
  ciphertext,
  principal,
  encryptedKey,
  publicKey,
  tsk,
}: IBEDecryptParams): Promise<Uint8Array> => {
  const keyBytes = tsk.decrypt({ encryptedKey, publicKey, principal });
  const ciphertextObj = vetkd.IBECiphertext.deserialize(ciphertext);
  return ciphertextObj.decrypt(keyBytes);
};
