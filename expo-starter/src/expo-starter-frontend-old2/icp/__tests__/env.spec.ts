import { describe, it, expect } from 'vitest';
import { reqdEnvFile } from '../env';

// vi.mock('../env', () => ({
//   reqdEnvFile: () => ({
//     DFX_VERSION: '0.24.3',
//     DFX_NETWORK: 'local',
//     CANISTER_CANDID_PATH: '/path/to/candid/file.did',
//     CANISTER_ID: 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
//     CANISTER_ID_EXPO_STARTER_BACKEND: 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
//     CANISTER_ID_INTERNET_IDENTITY: 'bd3sg-teaaa-aaaaa-qaaba-cai',
//   }),
// }));

describe('reqdEnvFile', () => {
  it('should parse environment variables correctly', async () => {
    const envVars = await reqdEnvFile();
    expect(envVars.DFX_NETWORK).toBeDefined();
  });

  // it('should ignore comment lines', () => {
  //   const envVars = reqdEnvFile();
  //   expect(envVars['# DFX CANISTER ENVIRONMENT VARIABLES']).toBeUndefined();
  // });

  // it('should handle quoted values correctly', () => {
  //   const envVars = reqdEnvFile();
  //   expect(envVars.DFX_VERSION).toBe('0.24.3');
  //   expect(envVars.DFX_NETWORK).toBe('local');
  // });

  // it('should handle paths with special characters', () => {
  //   const envVars = reqdEnvFile();
  //   expect(envVars.CANISTER_CANDID_PATH).toBe('/path/to/candid/file.did');
  // });

  // it('should return empty object when file reading fails', () => {
  //   vi.mock('../env', () => ({
  //     reqdEnvFile: () => ({}),
  //   }));
  //   const envVars = reqdEnvFile();
  //   expect(envVars).toEqual({});
  // });
});
