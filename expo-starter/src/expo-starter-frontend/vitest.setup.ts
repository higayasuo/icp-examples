import { vi } from 'vitest';

// Mock crypto global object
const mockSubtleCrypto: SubtleCrypto = {
  decrypt: () => Promise.resolve(new ArrayBuffer(0)),
  deriveBits: () => Promise.resolve(new ArrayBuffer(0)),
  deriveKey: () => Promise.resolve({} as CryptoKey),
  digest: (algorithm: string | Algorithm, data: BufferSource) => {
    const mockHash = new Uint8Array(32).fill(1);
    return Promise.resolve(mockHash.buffer);
  },
  encrypt: () => Promise.resolve(new ArrayBuffer(0)),
  exportKey: ((format: string, key: CryptoKey) => {
    if (format === 'jwk') {
      return Promise.resolve({
        kty: 'mock',
        k: 'mock',
        alg: 'mock',
        key_ops: [],
      });
    }
    return Promise.resolve(new ArrayBuffer(0));
  }) as SubtleCrypto['exportKey'],
  generateKey: (async (
    algorithm: any,
    extractable: boolean,
    keyUsages: string[],
  ) => {
    return {
      privateKey: {
        algorithm: { name: 'MOCK' },
        extractable: true,
        type: 'private',
        usages: ['sign'],
      } as CryptoKey,
      publicKey: {
        algorithm: { name: 'MOCK' },
        extractable: true,
        type: 'public',
        usages: ['verify'],
      } as CryptoKey,
    };
  }) as SubtleCrypto['generateKey'],
  importKey: () => Promise.resolve({} as CryptoKey),
  sign: () => Promise.resolve(new ArrayBuffer(0)),
  unwrapKey: () => Promise.resolve({} as CryptoKey),
  verify: () => Promise.resolve(false),
  wrapKey: () => Promise.resolve(new ArrayBuffer(0)),
};

const mockCrypto: Crypto = {
  getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
    if (array instanceof Uint8Array) {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  },
  subtle: mockSubtleCrypto,
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
};

// Mock window.crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
  enumerable: true,
  configurable: true,
});

// Mock Platform
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: any) => obj.web,
  },
}));

// Mock expo-crypto
vi.mock('expo-crypto', () => ({
  getRandomBytes: vi.fn((size: number) => new Uint8Array(size).fill(1)),
  digestStringAsync: vi.fn(async (_, input: string) => {
    const mockResults: { [key: string]: string } = {
      test: 'n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=',
      test1: 'pmWkWSBCL51Bfkhn79xPuKBKHz//H6B+mY6G9/eieuM=',
      test2: 'Ayg8YqmYXJqY8l/WPGzHBhT/4ra4BO1dlgYB0tW8Y5k=',
      '': '47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
    };
    return mockResults[input] || mockResults['test'];
  }),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
  CryptoEncoding: {
    BASE64: 'base64',
  },
}));
