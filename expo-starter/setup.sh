#!/usr/bin/env bash
set -e

curl https://sh.rustup.rs -sSf | sh -s -- -y
~/.cargo/bin/rustup target add wasm32-unknown-unknown
~/.cargo/bin/cargo install candid-extractor
~/.cargo/bin/cargo install ic-wasm
DFXVM_INIT_YES=true sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"