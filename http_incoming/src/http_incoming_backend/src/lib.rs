use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{Cell, DefaultMemoryImpl};
use std::cell::RefCell;

use http::{RawHttpRequest, RawHttpResponse};
use ic_cdk::{export_candid, query, update};

mod http;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static COUNTER: RefCell<Cell<u64, VirtualMemory<DefaultMemoryImpl>>> = RefCell::new(
        Cell::init(
            MEMORY_MANAGER.with_borrow(|m| m.get(MemoryId::new(0))), 0_u64,
        ).unwrap()
    );
}

#[query]
async fn http_request(req: RawHttpRequest) -> RawHttpResponse {
    ic_cdk::println!("{:?}", req);

    if req.method.to_lowercase() == *"post" {
        return upgrade_response();
    }

    match req.url.as_str() {
        "/counter" => counter_response(),
        _ => not_found_response(),
    }
}

#[update]
async fn http_request_update(req: RawHttpRequest) -> RawHttpResponse {
    ic_cdk::println!("{:?}", req);

    match req.url.as_str() {
        "/counter" => update_counter_response(),
        _ => not_found_response(),
    }
}

fn upgrade_response() -> RawHttpResponse {
    RawHttpResponse {
        status_code: 204_u16,
        headers: vec![],
        body: vec![],
        upgrade: Some(true),
    }
}

fn counter_response() -> RawHttpResponse {
    let counter = COUNTER.with_borrow(|c| *c.get());
    RawHttpResponse {
        status_code: 200_u16,
        headers: vec![("Content-Type".to_string(), "text/plain".to_string())],
        body: format!("counter: {}\n", counter).into_bytes(),
        upgrade: None,
    }
}

fn not_found_response() -> RawHttpResponse {
    RawHttpResponse {
        status_code: 404_u16,
        headers: vec![("Content-Type".to_string(), "text/plain".to_string())],
        body: "404 Page Not Found\n".to_string().into_bytes(),
        upgrade: None,
    }
}

fn update_counter_response() -> RawHttpResponse {
    let counter = COUNTER.with_borrow(|c| *c.get()) + 1;
    COUNTER.with_borrow_mut(|c| {
        c.set(counter).unwrap();
    });
    RawHttpResponse {
        status_code: 200_u16,
        headers: vec![("Content-Type".to_string(), "text/plain".to_string())],
        body: format!("updated counter: {}\n", counter).into_bytes(),
        upgrade: None,
    }
}

export_candid!();
