# How it works
This document explains how to authenticate with Internet Identity in an Expo app and connect to the Backend of ICP.
Since the content is quite complex, we will first understand the concepts in natural language, and then explain the code.

The Japanese version is available [here](how_it_works_ja.md).

## What is Internet Identity

Internet Identity is an account system for accessing services on the Internet Computer. While it is equivalent to traditional Google accounts and Apple IDs, it offers the following benefits:

- No collection or tracking of personal information by platform companies
- A decentralized account system suitable for the Web3.0 era
- Secure login using biometric authentication (passkeys)

By addressing the issues of conventional centralized account systems, it realizes a Web3.0-era account service that is more secure and privacy-focused.

The Internet Identity Frontend is provided as a [web application](https://identity.ic0.app/).

## Tips for Using Internet Identity with Expo

### Internet Identity Not Working with Expo

- Reason for not working:
  - Internet Identity uses window.postMessage()
  - window.postMessage() is not supported in Expo

#### Solution

Authentication flow is implemented by separating authentication process to Web Frontend:

1. In Expo App:
  - Generate SignIdentity (public-private key pair)
  - Launch Web Frontend in external browser
  - Pass the generated public key to Web Frontend

2. In Web Frontend:
  - Use public key received from Expo app
  - Execute Internet Identity authentication
  - Get DelegationChain after successful authentication
  - Return DelegationChain to Expo app via redirect

3. Authentication Completion Process in Expo App:
  - Generate DelegationIdentity by combining SignIdentity and DelegationChain

#### DelegationChain Characteristics
- Contains user's public key
- Contains certificate for signature authority delegation from user to app

#### Communication Mechanism
- Communication from external browser to Expo app uses redirect(Custom URL)
- Authentication information transfer limited to DelegationChain only (private key not transferred)

### Structure and Mechanism of DelegationIdentity

DelegationIdentity is a mechanism that allows apps to sign transactions while maintaining the user as the transaction owner.

#### Components
- SignIdentity: Holds the private key and provides transaction signing functionality
- DelegationChain: Delegation of signing authority from users to applications

#### Transaction Processing Flow

1. Application Side:
  - Performs transaction signing
  - Sends transaction to ICP

2. ICP Verification Process:
  - Verifies the certificates in DelegationChain
  - Retrieves app's public key from DelegationChain
  - Verifies transaction signature using app's public key

3. Transaction Execution:
  - After all verifications succeed, executes the transaction as a legitimate user operation

### Storing DelegationIdentity

- Elements to store:
  - SignIdentity: Store in secure storage (expo-secure-store)
    - Reason: Contains private key
  - DelegationChain: Store in regular storage (@react-native-async-storage/async-storage)
    - Reason: Contains no confidential information

#### DelegationIdentity Recovery Process on Restart

1. Loading from Storage:
  - Load SignIdentity from secure storage
  - Load DelegationChain from regular storage

2. DelegationIdentity Generation:
  - Create DelegationIdentity by combining the loaded SignIdentity and DelegationChain

### Actor Connecting to Backend

An Actor connecting to the Backend operates with DelegationIdentity as follows:

#### Process Flow

1. Actor Operation:
  - Receives Backend method calls
  - Signs transactions using DelegationIdentity
  - Sends signed transactions to ICP

2. ICP Processing:
  - Verifies DelegationChain certificates
  - Retrieves delegated app's public key from DelegationChain
  - Verifies transaction signature using app's public key
  - After verification, executes transaction as user operation

#### Key Points

- App signs transactions, but execution is processed as user operation
- DelegationChain proves legitimate delegation of signing authority to the app

## Understanding through Code - Native (iOS/Android)

Let's understand the content explained so far through code.

### When Launching Expo App

#### Setting up baseKey

baseKey is the app's SignIdentity.

##### React State Setup

```typescript
const [baseKey, setBaseKey] = useState<Ed25519KeyIdentity | undefined>(
  undefined,
);
```

##### Process Flow

1. Load baseKey from secure storage:
```typescript
const storedBaseKey = await SecureStore.getItemAsync('baseKey');
```

2. baseKey initialization process:
```typescript
if (storedBaseKey) {
  if (!baseKey) {
    console.log('Restoring baseKey');
    const key = Ed25519KeyIdentity.fromJSON(storedBaseKey);
    setBaseKey(key);
  }
} else {
  console.log('Generating new baseKey');
  const key = Ed25519KeyIdentity.generate();
  await SecureStore.setItemAsync('baseKey', JSON.stringify(key.toJSON()));
  setBaseKey(key);
}
```

##### Important Points
- Ed25519KeyIdentity is a type of SignIdentity
- Secure storage is used to protect the private key
- Restores existing baseKey if available, generates new one if not

#### Setting up identity

identity refers to DelegationIdentity.

##### React State Setup
```typescript
const [identity, setIdentity] = useState<DelegationIdentity | undefined>(
  undefined,
);
```

##### Process Flow

1. Load delegation from regular storage:
```typescript
const storedDelegation = await AsyncStorage.getItem('delegation');
```

2. Identity restoration process:
```typescript
if (!identity && storedBaseKey && storedDelegation) {
  const baseKey = Ed25519KeyIdentity.fromJSON(storedBaseKey);
  const delegation = DelegationChain.fromJSON(storedDelegation);
  const identity = DelegationIdentity.fromDelegation(baseKey, delegation);

  if (isDelegationValid(delegation)) {
    console.log('Setting identity from baseKey and delegation');
    setIdentity(identity);
  } else {
    console.log('Invalid delegation chain, removing delegation');
    await AsyncStorage.removeItem('delegation');
  }
}
```

##### Important Points
- Skips processing if identity already exists
- Delegation expires in 8 hours (default)
- Expired delegations are removed

##### Setup Completion Management
```typescript
const [isReady, setIsReady] = useState(false);
setIsReady(true);  // Updated when setup is complete
```

[useAuth.ts source code](../src/expo-starter-frontend/hooks/useAuth.ts)

### Login Process in Expo App

#### Overview
- Purpose: Call Web Frontend (ii-integration) for Internet Identity authentication
- Process Flow:
  1. Prepare URL and parameters for authentication
  2. Launch ii-integration in external browser
  3. Configure return to login page after authentication

#### Complete Code
```typescript
const redirectUri = createURL('/');

if (!baseKey) {
  throw new Error('No base key');
}

const pubkey = toHex(baseKey.getPublicKey().toDer());

const iiUri = getInternetIdentityURL();

const iiIntegrationURL = getCanisterURL(
  ENV_VARS.CANISTER_ID_II_INTEGRATION,
);
const url = new URL(iiIntegrationURL);

url.searchParams.set('redirect_uri', redirectUri);
url.searchParams.set('pubkey', pubkey);
url.searchParams.set('ii_uri', iiUri);

await AsyncStorage.setItem('lastPath', pathname);
await WebBrowser.openBrowserAsync(url.toString());
```

#### Detailed Process Explanation

1. Setting up Redirect URL
```typescript
import { createURL } from 'expo-linking';
const redirectUri = createURL('/');
```
- Custom URL for returning to app after authentication
- createURL absorbs differences between development and production environments
- Uses special custom URL during development with Expo Go

2. Public Key Preparation
```typescript
if (!baseKey) {
  throw new Error('No base key');
}
const pubkey = toHex(baseKey.getPublicKey().toDer());
```
- Retrieves public key from baseKey (app's SignIdentity)
- Converts to hexadecimal string for use

3. Internet Identity URL Configuration
```typescript
const iiUri = getInternetIdentityURL();
```
- Gets Internet Identity URL based on environment
- Production: `https://identity.ic0.app`
- Development: Local Canister URL
  - Chrome: `http://<canisterId>.localhost:4943`
  - Others: `https://<HOST IP>:24943/?canisterId=<canisterId>`

4. ii-integration URL Generation
```typescript
const iiIntegrationURL = getCanisterURL(
  ENV_VARS.CANISTER_ID_II_INTEGRATION,
);
const url = new URL(iiIntegrationURL);

url.searchParams.set('redirect_uri', redirectUri);
url.searchParams.set('pubkey', pubkey);
url.searchParams.set('ii_uri', iiUri);
```
- Generates base URL for ii-integration
- Sets required parameters:
  - redirect_uri: Return URL after authentication
  - pubkey: App's public key
  - ii_uri: Internet Identity URL

5. Browser Launch Preparation and Execution
```typescript
await AsyncStorage.setItem('lastPath', pathname);
await WebBrowser.openBrowserAsync(url.toString());
```
- Saves current page path (for post-authentication navigation)
- Launches ii-integration in external browser

#### Development Environment Considerations

##### How to Access Local Development Server

1. Access from PC:
  - Accessible via localhost (127.0.0.1)
  - Chrome: Direct access via `http://<canisterId>.localhost:4943`
  - Other browsers: Direct access via `http://localhost:4943/?canisterId=<canisterId>`

2. Access from Smartphone:
  - Cannot use localhost
  - Must use PC's IP address (e.g., 192.168.0.210)
  - HTTPS access required due to security requirements

##### HTTPS Access Configuration

1. local-ssl-proxy setup:
```json
"ssl:ii": "local-ssl-proxy --source 24943 --target 4943 --key ./.mkcert/192.168.0.210-key.pem --cert ./.mkcert/192.168.0.210.pem"
```

2. Access Methods:
  - Original address: `http://localhost:4943`
  - After proxy: `https://192.168.0.210:24943`
  - Access from smartphone using the latter address

[useAuth.ts source code](../src/expo-starter-frontend/hooks/useAuth.ts)

### Initialization Process of ii-integration

#### Overview
- Purpose: Define event handler to execute Internet Identity authentication on login button click and return DelegationChain to Expo app upon successful authentication
- Process Flow:
  1. Retrieve necessary information from URL parameters
  2. Create AuthClient and execute authentication
  3. Return DelegationChain to Expo app after successful authentication

#### Complete Code
```typescript
try {
  const { redirectUri, identity, iiUri } = parseParams();
  const authClient = await AuthClient.create({ identity });
  const loginButton = document.querySelector('#ii-login-button') as HTMLButtonElement;

  loginButton.addEventListener('click', async () => {
    renderError('');
    try {
      await authClient.login({
        identityProvider: iiUri,
        onSuccess: () => {
          try {
            const delegationIdentity = authClient.getIdentity() as DelegationIdentity;
            const url = buildRedirectURLWithDelegation(redirectUri, delegationIdentity);
            window.location.href = url;
          } catch (error) {
            renderError(formatError('delegation retrieval failed', error));
          }
        },
        onError: (error?: string) => {
          renderError(formatError('authentication rejected', error || 'Unknown error'));
        },
      });
    } catch (error) {
      renderError(formatError('login process failed', error));
    }
  });
} catch (error) {
  renderError(formatError('initialization failed', error));
}
```

#### Detailed Process Explanation

1. URL Parameter Retrieval and Parsing
```typescript
const { redirectUri, identity, iiUri } = parseParams();
```
- Information received from Expo app:
  - redirectUri: Return URL after authentication
  - pubkey: Expo app's public key
  - iiUri: Internet Identity URL
- Generate SignIdentity containing only public key

2. AuthClient Creation and Login Button Retrieval
```typescript
const authClient = await AuthClient.create({ identity });
const loginButton = document.querySelector('#ii-login-button') as HTMLButtonElement;
```
- AuthClient creation:
  - Uses identity containing Expo app's public key
  - Used for signature authority delegation
- Login button retrieval:
  - Used to initiate authentication process on click

3. Authentication Process Setup
```typescript
loginButton.addEventListener('click', async () => {
  renderError('');
  try {
    await authClient.login({
      identityProvider: iiUri,
      onSuccess: () => {
        try {
          const delegationIdentity = authClient.getIdentity() as DelegationIdentity;
          const url = buildRedirectURLWithDelegation(redirectUri, delegationIdentity);
          window.location.href = url;
        } catch (error) {
          renderError(formatError('delegation retrieval failed', error));
        }
      },
      onError: (error?: string) => {
        renderError(formatError('authentication rejected', error || 'Unknown error'));
      },
    });
  } catch (error) {
    renderError(formatError('login process failed', error));
  }
});
```
- Sets up login button click handler
- Click processing:
  - Clears error messages
  - Executes Internet Identity authentication
  - On success: Returns to Expo app with URL containing DelegationChain
  - On failure: Displays error message

4. DelegationChain Generation and Return
```typescript
const buildRedirectURLWithDelegation = (redirectUri: string, delegationIdentity: DelegationIdentity): string => {
  const delegationString = JSON.stringify(
    delegationIdentity.getDelegation().toJSON()
  );
  const encodedDelegation = encodeURIComponent(delegationString);
  return `${redirectUri}?delegation=${encodedDelegation}`;
};
```

- DelegationChain retrieval and processing:
  - Get DelegationChain using delegationIdentity.getDelegation()
  - DelegationChain contains:
    - User's public key
    - Certificate for signature authority delegation to Expo app
  - Convert to JSON string and URL encode

- Return to Expo app:
  - Add DelegationChain as query parameter to redirect URL
  - URL transfer possible as no private key included
  - Expo app combines with SignIdentity to generate DelegationIdentity

[ii-integration source code](../src/ii-integration/index.ts)

### Processing When Returning to Expo App from ii-integration

#### Overview
- Purpose: Generate DelegationIdentity using DelegationChain received after authentication
  - DelegationIdentity allows the app to sign transactions while processing transaction ownership as the user
- Process Flow:
  1. Retrieve DelegationChain from URL
  2. Generate and save DelegationIdentity
  3. Return to pre-authentication screen

#### Complete Code
```typescript
useEffect(() => {
  if (identity || !baseKey || !url) {
    return;
  }

  const search = new URLSearchParams(url?.split('?')[1]);
  const delegation = search.get('delegation');

  if (delegation) {
    const chain = DelegationChain.fromJSON(JSON.parse(delegation));
    AsyncStorage.setItem('delegation', JSON.stringify(chain.toJSON()));
    const id = DelegationIdentity.fromDelegation(baseKey, chain);
    setIdentity(id);
    console.log('set identity from delegation');
    WebBrowser.dismissBrowser();
    restorePreLoginScreen();
  }
}, [url, baseKey]);
```

#### Detailed Process Explanation

1. Prerequisite Check
```typescript
if (identity || !baseKey || !url) {
  return;
}
```
- Skip processing in these cases:
  - identity already exists
  - baseKey doesn't exist
  - URL doesn't exist

2. DelegationChain Retrieval and Processing
```typescript
const search = new URLSearchParams(url?.split('?')[1]);
const delegation = search.get('delegation');

if (delegation) {
  const chain = DelegationChain.fromJSON(JSON.parse(delegation));
  AsyncStorage.setItem('delegation', JSON.stringify(chain.toJSON()));
  const id = DelegationIdentity.fromDelegation(baseKey, chain);
  setIdentity(id);
}
```
- Retrieve DelegationChain from URL
- Save DelegationChain
- Generate DelegationIdentity from baseKey and DelegationChain

3. Screen Navigation Processing
```typescript
const restorePreLoginScreen = async () => {
  const path = await AsyncStorage.getItem('lastPath');
  if (path) {
    navigate(path);
    await AsyncStorage.removeItem('lastPath');
  } else {
    router.replace('/');
  }
};
```
- Retrieve and navigate to saved screen path:
  - If lastPath exists: navigate to saved screen
  - If lastPath doesn't exist: navigate to root screen
- Delete used lastPath

#### Important Points
- Combination of DelegationChain and baseKey enables:
  - App to sign transactions
  - Transactions to be processed as user operations
- DelegationChain stored in regular storage as it contains no secure information

[useAuth.ts source code](../src/expo-starter-frontend/hooks/useAuth.ts)

### How to Access Backend

#### Overview
- Purpose: Communicate with backend in type-safe manner using Actor
- Features:
  - Access Rust-implemented backend from TypeScript
  - Sign transactions using DelegationIdentity

#### Frontend Implementation
```typescript
// Actor creation
const { identity, ... } = useAuth();
const backend = identity ? createBackend(identity) : undefined;

// Backend call
return backend.whoami();
```

#### Backend Implementation (Rust)
```rust
#[ic_cdk::query]
fn whoami() -> String {
    ic_cdk::caller().to_text()
}
```

#### Process Flow
- Frontend:
  - Create Actor using DelegationIdentity
  - Call backend methods through Actor
- Backend:
  - Return caller's (user's) Principal as string

[expo-starter-backend source code](../src/expo-starter-backend/src/lib.rs)