# http_incoming

```bash
git clone https://github.com/higayasuo/icp-examples
cd icp-examples/http_incoming/

dfx start --background

dfx deploy http_incoming_backend
CANISTER_ID=$(dfx canister id http_incoming_backend)

curl $CANISTER_ID.localhost:4943/counter
counter: 0

curl -X POST $CANISTER_ID.localhost:4943/counter
updated counter: 1
```
