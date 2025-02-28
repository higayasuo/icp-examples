import React, { createContext, useContext } from 'react';
import { DelegationIdentity } from '@dfinity/identity';
import { Principal } from '@dfinity/principal';

interface AuthContextType {
  identity: DelegationIdentity | undefined;
  isReady: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  aesEncrypt: (params: { plaintext: Uint8Array }) => Promise<Uint8Array>;
  aesDecrypt: (params: { ciphertext: Uint8Array }) => Promise<Uint8Array>;
  hasAesKey: boolean;
  clearAesRawKey: () => void;
  transportPublicKey: Uint8Array;
  decryptExistingAesKey: (
    encryptedAesKey: Uint8Array,
    encryptedKey: Uint8Array,
    publicKey: Uint8Array,
    principal: Principal,
  ) => Promise<void>;
  generateAesKey: () => Promise<void>;
  generateAndEncryptAesKey: (
    publicKey: Uint8Array,
    principal: Principal,
  ) => Promise<Uint8Array>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
  value: AuthContextType;
}

export function AuthProvider({ children, value }: AuthProviderProps) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
