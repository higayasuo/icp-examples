#!/usr/bin/env zsh
set -e

# Get the directory where the script is located
SCRIPT_DIR=$(cd $(dirname $0) && pwd)
# Move to the project root directory
cd $SCRIPT_DIR/..

project="expo-starter"
backend="${project}-backend"
backend_underscore=${backend//-/_}
frontend="${project}-frontend"
did_file="src/${backend}/${backend}.did"
wasm_file="target/wasm32-unknown-unknown/release/${backend_underscore}.wasm"
icp_dir="src/${frontend}/icp"
declarations_dir="src/declarations/${backend}"
declarations_did_file="${declarations_dir}/${backend}.did"
declarations_did_d_ts_file="${declarations_did_file}.d.ts"
declarations_did_js_file="${declarations_did_file}.js"

cargo build \
    --target wasm32-unknown-unknown \
    --release \
    --package "$backend"
echo "Built backend"

candid-extractor $wasm_file 2>/dev/null > $did_file
echo "Extracted candid"

ic-wasm $wasm_file -o $wasm_file metadata candid:service -v public -f $did_file
echo "Generated metadata"

ic-wasm $wasm_file -o $wasm_file shrink
echo "Shrunk wasm"

dfx generate -qq $backend
echo "Generated declarations"

cp $declarations_did_d_ts_file $icp_dir
cp $declarations_did_js_file $icp_dir
echo "Copied declarations"
