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
  - Internet Identity uses window.postMessage() for authentication
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
- Contains certificate for signature authority delegation

#### Communication Mechanism
- Communication between external browser and Expo app uses redirect
- Authentication information transfer limited to DelegationChain only (private key not transferred)

### Structure and Mechanism of DelegationIdentity

DelegationIdentity is a mechanism that allows apps to sign transactions while maintaining the user as the transaction owner.

#### Components
- SignIdentity: Holds the private key and provides transaction signing functionality
- DelegationChain: Contains certificates proving the delegation of signing authority from users to applications

#### Transaction Processing Flow

1. Application Side:
  - Performs transaction signing
  - Sends transaction to ICP

2. ICP Verification Process:
  - Verifies the certificates in DelegationChain
  - Retrieves delegated app's public key from DelegationChain
  - Verifies transaction signature using app's public key

3. Transaction Execution:
  - After all verifications succeed, executes the transaction as a legitimate user operation

### Storing DelegationIdentity

- Elements to store:
  - SignIdentity: Store in secure storage (expo-secure-store)
    - Reason: Contains sensitive information including private key
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


