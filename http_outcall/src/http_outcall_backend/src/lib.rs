use ic_cdk::{
    api::management_canister::http_request::{
        http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
    },
    export_candid, update,
};
use serde::{Deserialize, Serialize};

const BASE_URL: &str = "https://tw-isid-test.web.app";

fn http_request_required_cycles(arg: &CanisterHttpRequestArgument) -> u128 {
    let max_response_bytes = match arg.max_response_bytes {
        Some(ref n) => *n as u128,
        None => 2 * 1024 * 1024u128, // default 2MiB
    };
    let arg_raw = candid::utils::encode_args((arg,)).expect("Failed to encode arguments.");
    // The fee is for a 13-node subnet to demonstrate a typical usage.
    (3_000_000u128
        + 60_000u128 * 13
        + (arg_raw.len() as u128 + "http_request".len() as u128) * 400
        + max_response_bytes * 800)
        * 13
}

#[update]
async fn get() -> String {
    let arg = CanisterHttpRequestArgument {
        url: format!("{}/{}", BASE_URL, "hello?name=ho%20ge"),
        max_response_bytes: Some(3000),
        method: HttpMethod::GET,
        headers: vec![],
        body: None,
        transform: None,
    };

    let cycles = http_request_required_cycles(&arg);
    let response = http_request(arg.clone(), cycles).await.unwrap().0;
    //assert_eq!(response.status, 200);

    String::from_utf8(response.body).unwrap()
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct QsgetResponse {
    result: String,
    result2: String,
}

#[update]
async fn qsget() -> String {
    let arg = CanisterHttpRequestArgument {
        url: format!("{}/{}", BASE_URL, "qsGet?arg1=aaa%20bbb&arg2=1"),
        max_response_bytes: Some(3000),
        method: HttpMethod::GET,
        headers: vec![],
        body: None,
        transform: None,
    };
    //ic_cdk::println!("URL: {}", arg.url);

    let cycles = http_request_required_cycles(&arg);
    let response = http_request(arg, cycles).await.unwrap().0;
    assert_eq!(response.status, 200);

    let body_str = std::str::from_utf8(&response.body).unwrap();
    let res: QsgetResponse = serde_qs::from_str(body_str).unwrap();
    format!("{:?}", res)
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct KeyResponse {
    keys: Vec<JwkKey>,
}

#[derive(Debug, Deserialize, Eq, PartialEq)]
pub struct JwkKey {
    pub e: String,
    pub alg: String,
    pub kty: String,
    pub kid: String,
    pub n: String,
}

#[update]
async fn jsonget() -> String {
    let arg = CanisterHttpRequestArgument {
        url: format!("{}/{}", BASE_URL, "jsonGet"),
        max_response_bytes: Some(3000),
        method: HttpMethod::GET,
        headers: vec![],
        body: None,
        transform: None,
    };
    //ic_cdk::println!("URL: {}", arg.url);

    let cycles = http_request_required_cycles(&arg);
    let response = http_request(arg, cycles).await.unwrap().0;
    assert_eq!(response.status, 200);

    let res: KeyResponse = serde_json::from_slice(&response.body).unwrap();
    format!("{:?}", res)
}

#[derive(Serialize)]
struct FormpostBody {
    arg1: u32,
    arg2: u32,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
struct FormpostResponse {
    result: u32,
}

#[update]
async fn formpoost() -> String {
    let headers = vec![HttpHeader {
        name: "Content-Type".to_owned(),
        value: "application/x-www-form-urlencoded".to_owned(),
    }];
    let body = FormpostBody { arg1: 1, arg2: 2 };
    let body_str = serde_qs::to_string(&body).unwrap();
    let arg = CanisterHttpRequestArgument {
        url: format!("{}/{}", BASE_URL, "add"),
        max_response_bytes: Some(3000),
        method: HttpMethod::POST,
        headers,
        body: Some(body_str.into_bytes()),
        transform: None,
    };
    //ic_cdk::println!("URL: {}", arg.url);

    let cycles = http_request_required_cycles(&arg);
    let response = http_request(arg, cycles).await.unwrap().0;
    assert_eq!(response.status, 200);

    let body_str = std::str::from_utf8(&response.body).unwrap();
    let res: FormpostResponse = serde_qs::from_str(body_str).unwrap();
    format!("{:?}", res)
}

export_candid!();
