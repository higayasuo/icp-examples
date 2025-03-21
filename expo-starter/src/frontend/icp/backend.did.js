export const idlFactory = ({ IDL }) => {
  const AsymmetricKeysReply = IDL.Record({
    'encrypted_key' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'public_key' : IDL.Vec(IDL.Nat8),
    'encrypted_aes_key' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const VetKDCurve = IDL.Variant({ 'bls12_381_g2' : IDL.Null });
  const VetKDKeyId = IDL.Record({ 'name' : IDL.Text, 'curve' : VetKDCurve });
  const VetKDEncryptedKeyRequest = IDL.Record({
    'key_id' : VetKDKeyId,
    'derivation_path' : IDL.Vec(IDL.Vec(IDL.Nat8)),
    'derivation_id' : IDL.Vec(IDL.Nat8),
    'encryption_public_key' : IDL.Vec(IDL.Nat8),
  });
  const VetKDEncryptedKeyReply = IDL.Record({
    'encrypted_key' : IDL.Vec(IDL.Nat8),
  });
  const VetKDPublicKeyRequest = IDL.Record({
    'key_id' : VetKDKeyId,
    'canister_id' : IDL.Opt(IDL.Principal),
    'derivation_path' : IDL.Vec(IDL.Vec(IDL.Nat8)),
  });
  const VetKDPublicKeyReply = IDL.Record({ 'public_key' : IDL.Vec(IDL.Nat8) });
  return IDL.Service({
    'asymmetric_keys' : IDL.Func(
        [IDL.Vec(IDL.Nat8)],
        [AsymmetricKeysReply],
        [],
      ),
    'asymmetric_save_encrypted_aes_key' : IDL.Func([IDL.Vec(IDL.Nat8)], [], []),
    'vetkd_derive_encrypted_key' : IDL.Func(
        [VetKDEncryptedKeyRequest],
        [VetKDEncryptedKeyReply],
        [],
      ),
    'vetkd_public_key' : IDL.Func(
        [VetKDPublicKeyRequest],
        [VetKDPublicKeyReply],
        [],
      ),
    'whoami' : IDL.Func([], [IDL.Text], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
