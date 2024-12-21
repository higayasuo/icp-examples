#[ic_cdk::query]
fn greet2(name: String) -> String {
    format!("Hello, {}!", name)
}

ic_cdk::export_candid!();
