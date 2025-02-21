import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AsymmetricKeysReply {
  'encrypted_key' : Uint8Array | number[],
  'public_key' : Uint8Array | number[],
}
export type VetKDCurve = { 'bls12_381_g2' : null };
export interface VetKDEncryptedKeyReply {
  'encrypted_key' : Uint8Array | number[],
}
export interface VetKDEncryptedKeyRequest {
  'key_id' : VetKDKeyId,
  'derivation_path' : Array<Uint8Array | number[]>,
  'derivation_id' : Uint8Array | number[],
  'encryption_public_key' : Uint8Array | number[],
}
export interface VetKDKeyId { 'name' : string, 'curve' : VetKDCurve }
export interface VetKDPublicKeyReply { 'public_key' : Uint8Array | number[] }
export interface VetKDPublicKeyRequest {
  'key_id' : VetKDKeyId,
  'canister_id' : [] | [Principal],
  'derivation_path' : Array<Uint8Array | number[]>,
}
export interface _SERVICE {
  'asymmetric_encrypted_key' : ActorMethod<
    [Uint8Array | number[]],
    Uint8Array | number[]
  >,
  'asymmetric_keys' : ActorMethod<[Uint8Array | number[]], AsymmetricKeysReply>,
  'asymmetric_public_key' : ActorMethod<[], Uint8Array | number[]>,
  'vetkd_derive_encrypted_key' : ActorMethod<
    [VetKDEncryptedKeyRequest],
    VetKDEncryptedKeyReply
  >,
  'vetkd_public_key' : ActorMethod<
    [VetKDPublicKeyRequest],
    VetKDPublicKeyReply
  >,
  'whoami' : ActorMethod<[], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
