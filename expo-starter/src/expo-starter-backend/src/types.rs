use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

pub type CanisterId = Principal;

#[derive(CandidType, Deserialize, Eq, PartialEq)]
pub enum VetKDCurve {
    #[serde(rename = "bls12_381_g2")]
    #[allow(non_camel_case_types)]
    Bls12_381_G2,
}

#[derive(CandidType, Deserialize, Eq, PartialEq)]
pub struct VetKDKeyId {
    pub curve: VetKDCurve,
    pub name: String,
}

#[derive(CandidType, Deserialize)]
pub struct VetKDPublicKeyRequest {
    pub canister_id: Option<CanisterId>,
    pub derivation_path: Vec<Vec<u8>>,
    pub key_id: VetKDKeyId,
}

#[derive(CandidType)]
pub struct VetKDPublicKeyReply {
    pub public_key: Vec<u8>,
}

#[derive(CandidType, Deserialize)]
pub struct VetKDEncryptedKeyRequest {
    pub derivation_path: Vec<Vec<u8>>,
    pub derivation_id: Vec<u8>,
    pub key_id: VetKDKeyId,
    pub encryption_public_key: Vec<u8>,
}

#[derive(CandidType)]
pub struct VetKDEncryptedKeyReply {
    pub encrypted_key: Vec<u8>,
}

#[derive(CandidType, Serialize)]
pub struct AsymmetricKeysReply {
    pub public_key: Vec<u8>,
    pub encrypted_key: Option<Vec<u8>>,
    pub encrypted_aes_key: Option<Vec<u8>>,
}
