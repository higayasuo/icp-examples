#!/usr/bin/env bash
set -e

package="$1"
did_file="src/$package/$package.did"
wasm_file="target/wasm32-unknown-unknown/release/$package.wasm"
opt_wasm_file="target/wasm32-unknown-unknown/release/$package-opt.wasm"

cargo build \
    --target wasm32-unknown-unknown \
    --release \
    --package "$package"

candid-extractor $wasm_file 2>/dev/null > $did_file

ic-wasm $wasm_file -o $wasm_file metadata candid:service -v public -f $did_file

ic-wasm $wasm_file -o $opt_wasm_file shrink
