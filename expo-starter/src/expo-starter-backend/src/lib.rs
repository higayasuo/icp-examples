use ic_cdk::caller;

#[ic_cdk::query]
fn whoami() -> String {
    format!("Hello, {}!", caller().to_text())
}

ic_cdk::export_candid!();
