#[ic_cdk::query]
fn whoami() -> String {
    ic_cdk::caller().to_text()
}

ic_cdk::export_candid!();
