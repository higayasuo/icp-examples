use candid::CandidType;
use serde::{Deserialize, Serialize};

// #[derive(Debug, CandidType, Serialize, Deserialize, Clone)]
// pub struct HeaderField(String, String);

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct RawHttpRequest {
    pub method: String,
    pub url: String,
    pub headers: Vec<(String, String)>,
    //#[serde(with = "serde_bytes")]
    pub body: Vec<u8>,
}

#[derive(CandidType, Serialize)]
pub struct RawHttpResponse {
    pub status_code: u16,
    pub headers: Vec<(String, String)>,
    //#[serde(with = "serde_bytes")]
    pub body: Vec<u8>,
    pub upgrade: Option<bool>,
}
