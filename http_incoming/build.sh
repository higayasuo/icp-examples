#!/usr/bin/env bash
set -e

package="$1"
did_file="src/$package/$package.did"
wasm_file="target/wasm32-unknown-unknown/release/$package.wasm"
opt_wasm_file="target/wasm32-unknown-unknown/release/$package-opt.wasm"

if [ -z "$(rustup show | grep wasm32-unknown-unknown)" ]; then rustup target add --toolchain stable wasm32-unknown-unknown;fi

if [ -z "$(which candid-extractor)" ]; then cargo install candid-extractor;fi

if [ -z "$(which ic-wasm)" ]; then cargo install ic-wasm;fi

cargo build \
    --target wasm32-unknown-unknown \
    --release \
    --package "$package"

candid-extractor $wasm_file 2>/dev/null > $did_file

ic-wasm $wasm_file -o $wasm_file metadata candid:service -v public -f $did_file

ic-wasm $wasm_file -o $opt_wasm_file shrink
