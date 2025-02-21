use crate::types::{
    AsymmetricKeysReply, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDPublicKeyReply,
    VetKDPublicKeyRequest,
};
use crate::vet_keys::{encrypted_key, public_key};

mod types;
mod vet_keys;
mod vet_keys_system;

#[ic_cdk::query]
fn whoami() -> String {
    ic_cdk::caller().to_text()
}

#[ic_cdk::update]
async fn asymmetric_keys(transport_public_key: Vec<u8>) -> AsymmetricKeysReply {
    let public_key = asymmetric_public_key().await;
    let encrypted_key = asymmetric_encrypted_key(transport_public_key).await;
    AsymmetricKeysReply {
        public_key,
        encrypted_key,
    }
}

#[ic_cdk::update]
async fn asymmetric_public_key() -> Vec<u8> {
    public_key("asymmetric").await
}

#[ic_cdk::update]
async fn asymmetric_encrypted_key(transport_public_key: Vec<u8>) -> Vec<u8> {
    encrypted_key(transport_public_key, "asymmetric").await
}

ic_cdk::export_candid!();
