import { Principal } from '@dfinity/principal';
import * as vetkd from 'ic-vetkd-utils';

/**
 * Encrypts a message using Identity-Based Encryption (IBE).
 * @param {Object} params - The parameters for IBE encryption.
 * @param {string} params.plaintext - The text to encrypt.
 * @param {Principal} params.principal - The principal for encryption.
 * @param {string} params.publicKey - The hex-encoded public key for encryption.
 * @param {Uint8Array} params.seed - The 32-byte random seed for encryption.
 * @returns {Promise<Uint8Array>} The encrypted data.
 */
export const ibeEncrypt = async ({
  plaintext,
  principal,
  publicKey,
  seed,
}: {
  plaintext: string;
  principal: Principal;
  publicKey: string;
  seed: Uint8Array;
}): Promise<Uint8Array> => {
  const principalBytes = principal.toUint8Array();
  const pkBytes = new Uint8Array(Buffer.from(publicKey, 'hex'));
  const messageBytes = new TextEncoder().encode(plaintext);

  const ciphertext = vetkd.IBECiphertext.encrypt(
    pkBytes,
    principalBytes,
    messageBytes,
    seed,
  );
  return ciphertext.serialize();
};
