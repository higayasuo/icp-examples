use crate::types::{
    AsymmetricKeysReply, VetKDEncryptedKeyReply, VetKDEncryptedKeyRequest, VetKDPublicKeyReply,
    VetKDPublicKeyRequest,
};
use crate::vet_keys::{encrypted_key, public_key};
use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap};
use std::cell::RefCell;

mod types;
mod vet_keys;
mod vet_keys_system;

// Define memory types
type Memory = VirtualMemory<DefaultMemoryImpl>;
type AesKeyMap = StableBTreeMap<Principal, Vec<u8>, Memory>;

// Memory manager for stable storage
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static ASYMMETRIC_AES_KEYS: RefCell<AesKeyMap> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
}

/**
 * Save encrypted AES key for the current user
 * @param encrypted_aes_key - The encrypted AES key to save
 */
#[ic_cdk::update]
fn asymmetric_save_encrypted_aes_key(encrypted_aes_key: Vec<u8>) {
    let caller = ic_cdk::caller();

    // Anonymous users cannot save keys
    if caller == Principal::anonymous() {
        ic_cdk::trap("Anonymous users cannot save keys");
    }

    ASYMMETRIC_AES_KEYS.with(|keys| {
        keys.borrow_mut().insert(caller, encrypted_aes_key);
    });
}

/**
 * Get encrypted AES key for the current user
 * @returns The encrypted AES key if it exists, or null if not found
 */
fn asymmetric_encrypted_aes_key() -> Option<Vec<u8>> {
    let caller = ic_cdk::caller();

    ASYMMETRIC_AES_KEYS.with(|keys| keys.borrow().get(&caller))
}

#[ic_cdk::query]
fn whoami() -> String {
    ic_cdk::caller().to_text()
}

#[ic_cdk::update]
async fn asymmetric_keys(transport_public_key: Vec<u8>) -> AsymmetricKeysReply {
    let public_key = asymmetric_public_key().await;
    let encrypted_aes_key = asymmetric_encrypted_aes_key();

    // Skip fetching encrypted_key if encrypted_aes_key exists
    let encrypted_key = if encrypted_aes_key.is_some() {
        Some(asymmetric_encrypted_key(transport_public_key).await)
    } else {
        None
    };

    AsymmetricKeysReply {
        public_key,
        encrypted_key,
        encrypted_aes_key,
    }
}

async fn asymmetric_public_key() -> Vec<u8> {
    public_key("asymmetric").await
}

async fn asymmetric_encrypted_key(transport_public_key: Vec<u8>) -> Vec<u8> {
    encrypted_key(transport_public_key, "asymmetric").await
}

ic_cdk::export_candid!();
