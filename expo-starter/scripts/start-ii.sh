#!/bin/bash

# Start II on port 4944
II_FETCH_ROOT_KEY=1 II_DUMMY_CAPTCHA=1 II_DUMMY_AUTH=1 II_DEV_CSP=1 dfx start --clean --host 0.0.0.0:4944 --network local_ii