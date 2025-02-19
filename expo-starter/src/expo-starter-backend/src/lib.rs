use crate::types::{
    VetKDCurve, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDKeyId, VetKDPublicKeyReply,
    VetKDPublicKeyRequest,
};
use crate::vet_keys::{vetkd_derive_encrypted_key, vetkd_public_key};

mod types;
mod vet_keys;

#[ic_cdk::query]
fn whoami() -> String {
    ic_cdk::caller().to_text()
}

#[ic_cdk::update]
async fn symmetric_key_verification_key() -> String {
    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_g2_test_key_1(),
    };

    let response = vetkd_public_key(request).await;

    hex::encode(response.public_key)
}

#[ic_cdk::update]
async fn encrypted_symmetric_key_for_caller(encryption_public_key: Vec<u8>) -> String {
    debug_println_caller("encrypted_symmetric_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        derivation_path: vec![b"symmetric_key".to_vec()],
        key_id: bls12_381_g2_test_key_1(),
        encryption_public_key,
    };

    let response = vetkd_derive_encrypted_key(request).await;

    hex::encode(response.encrypted_key)
}

#[ic_cdk::update]
async fn ibe_encryption_key() -> String {
    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![b"ibe_encryption".to_vec()],
        key_id: bls12_381_g2_test_key_1(),
    };

    let response = vetkd_public_key(request).await;

    hex::encode(response.public_key)
}

#[ic_cdk::update]
async fn encrypted_ibe_decryption_key_for_caller(encryption_public_key: Vec<u8>) -> String {
    debug_println_caller("encrypted_ibe_decryption_key_for_caller");

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        derivation_path: vec![b"ibe_encryption".to_vec()],
        key_id: bls12_381_g2_test_key_1(),
        encryption_public_key,
    };

    let response = vetkd_derive_encrypted_key(request).await;

    hex::encode(response.encrypted_key)
}

fn bls12_381_g2_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381_G2,
        name: "test_key_1".to_string(),
    }
}

fn debug_println_caller(method_name: &str) {
    ic_cdk::println!(
        "{}: caller: {} (isAnonymous: {})",
        method_name,
        ic_cdk::caller().to_text(),
        ic_cdk::caller() == candid::Principal::anonymous()
    );
}

ic_cdk::export_candid!();
