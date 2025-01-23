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

### @dfinity/auth-client Not Working with Expo

- Reason for not working:
  - Official @dfinity/auth-client uses window.postMessage()
  - window.postMessage() is not supported in Expo

#### Solution

- Authentication Flow Implementation:
  1. In Expo App:
     - Generate SignIdentity (public-private key pair)
     - Launch Web Frontend in external browser
     - Pass the generated public key to Web Frontend

  2. In Web Frontend:
     - Use received public key
     - Execute Internet Identity authentication
     - Return DelegationChain to Expo app after successful authentication

  3. In Expo App:
     - Combine SignIdentity with DelegationChain
     - Generate DelegationIdentity to complete authentication

#### Communication Method

- Communication between external browser and Expo app via redirect
- Only DelegationChain is transferred for authentication information

### What is DelegationIdentity?

`DelegationIdentity` is an authentication system consisting of the following two elements:
- `SignIdentity`: Provides the ability to sign transactions.
- `DelegationChain`: A certificate that proves the delegation of signing authority from the user to the app.

Flow of ICP transaction (Tx) processing:
1. The app signs the Tx.
2. ICP first verifies the `DelegationChain` certificate.
3. After verifying the certificate, ICP verifies the Tx with the delegated app's public key.
4. If all verifications are successful, the Tx is processed as executed by the user.

The `SignIdentity` included in `DelegationIdentity` has a private key for signing. Therefore, returning the `DelegationIdentity` itself to the Expo app via redirect should not be done for security reasons.

### How to Handle DelegationIdentity Securely

#### Basic Flow

**Preparation in Expo App**
- Create SignIdentity
- Extract public key from the created SignIdentity
- Transfer the extracted public key to Web Frontend

**Processing in Web Frontend**
- Generate SignIdentity without signing capability from received public key
- Pass this SignIdentity to auth-client
- After Internet Identity authentication, obtain DelegationIdentity without signing capability
- Extract DelegationChain and redirect to Expo app

**Final Stage (Expo App)**
- Combine DelegationChain received via redirect with
- Initially created SignIdentity to
- Generate complete DelegationIdentity

#### Security Considerations

Since DelegationChain only contains public information, it is safe to transfer via redirect. This method enables secure creation of DelegationIdentity with signing capabilities.

