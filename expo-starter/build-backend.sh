#!/usr/bin/env zsh
set -e

project="expo-starter"
backend="${project}-backend"
backend_underscore=${backend//-/_}
frontend="${project}-frontend"
did_file="src/${backend}/${backend}.did"
wasm_file="target/wasm32-unknown-unknown/release/${backend_underscore}.wasm"
canisters_dir="src/${frontend}/canisters"
declarations_dir="src/declarations/${backend}"
declarations_did_file="${declarations_dir}/${backend}.did"
declarations_did_d_ts_file="${declarations_did_file}.d.ts"
declarations_did_js_file="${declarations_did_file}.js"

cargo build \
    --target wasm32-unknown-unknown \
    --release \
    --package "$backend"

candid-extractor $wasm_file 2>/dev/null > $did_file

ic-wasm $wasm_file -o $wasm_file metadata candid:service -v public -f $did_file

ic-wasm $wasm_file -o $wasm_file shrink

dfx generate -qq $backend

cp $declarations_did_d_ts_file $canisters_dir
cp $declarations_did_js_file $canisters_dir
