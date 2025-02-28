import { Principal } from '@dfinity/principal';
import * as vetkd from 'ic-vetkd-utils-wasm2js';

export interface DecryptParams {
  encryptedKey: Uint8Array;
  publicKey: Uint8Array;
  principal: Principal;
}

export interface DecryptAndHashParams extends DecryptParams {
  keyLength: number;
  purpose: string;
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
 * Wrapper class for vetkd.TransportSecretKey
 * Encapsulates all vetkd dependencies
 */
export class TransportSecretKeyWrapper {
  private tsk: vetkd.TransportSecretKey;

  /**
   * Create a new TransportSecretKeyWrapper instance
   * @param {Uint8Array} seed - The 32-byte random seed for transport secret key
   */
  constructor(seed: Uint8Array) {
    this.tsk = new vetkd.TransportSecretKey(seed);
  }

  /**
   * Get public key from transport secret key
   * @returns {Uint8Array} The public key for transport secret key
   */
  getPublicKey(): Uint8Array {
    return this.tsk.public_key();
  }

  /**
   * Decrypt the encrypted key
   * @param {DecryptParams} params - The parameters for decryption
   * @returns {Uint8Array} The decrypted key bytes
   */
  decrypt({ encryptedKey, publicKey, principal }: DecryptParams): Uint8Array {
    const principalBytes = principal.toUint8Array();
    return this.tsk.decrypt(encryptedKey, publicKey, principalBytes);
  }

  /**
   * Decrypt and hash to derive a symmetric key
   * @param {DecryptAndHashParams} params - The parameters for key derivation
   * @returns {Uint8Array} The derived key bytes
   */
  decryptAndHash({
    encryptedKey,
    publicKey,
    principal,
    keyLength,
    purpose,
  }: DecryptAndHashParams): Uint8Array {
    const principalBytes = principal.toUint8Array();
    const purposeBytes = new TextEncoder().encode(purpose);
    return this.tsk.decrypt_and_hash(
      encryptedKey,
      publicKey,
      principalBytes,
      keyLength,
      purposeBytes,
    );
  }
}
