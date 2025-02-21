use crate::types::{VetKDCurve, VetKDEncryptedKeyRequest, VetKDKeyId, VetKDPublicKeyRequest};
use crate::vet_keys_system::{vetkd_derive_encrypted_key, vetkd_public_key};

pub async fn public_key(derivation_path: &str) -> Vec<u8> {
    debug_println_caller("public_key", derivation_path);

    let request = VetKDPublicKeyRequest {
        canister_id: None,
        derivation_path: vec![derivation_path.as_bytes().to_vec()],
        key_id: bls12_381_g2_test_key_1(),
    };

    let response = vetkd_public_key(request).await;

    response.public_key
}

pub async fn encrypted_key(encryption_public_key: Vec<u8>, derivation_path: &str) -> Vec<u8> {
    debug_println_caller("encrypted_key", derivation_path);

    let request = VetKDEncryptedKeyRequest {
        derivation_id: ic_cdk::caller().as_slice().to_vec(),
        derivation_path: vec![derivation_path.as_bytes().to_vec()],
        key_id: bls12_381_g2_test_key_1(),
        encryption_public_key,
    };

    let response = vetkd_derive_encrypted_key(request).await;

    response.encrypted_key
}

fn bls12_381_g2_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381_G2,
        name: "test_key_1".to_string(),
    }
}

fn debug_println_caller(method_name: &str, derivation_path: &str) {
    ic_cdk::println!(
        "{} ({}): caller: {} (isAnonymous: {})",
        method_name,
        derivation_path,
        ic_cdk::caller().to_text(),
        ic_cdk::caller() == candid::Principal::anonymous()
    );
}
