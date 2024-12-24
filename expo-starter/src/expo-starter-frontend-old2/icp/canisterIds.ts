const backendCanisterIds: {
  [key: string]: string;
} = {
  local: 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
  playground: '',
  ic: '',
};

export const getBackendCanisterId = (network: string) => {
  if (!backendCanisterIds[network]) {
    throw new Error(`Backend canister ID not found for network: ${network}`);
  }

  return backendCanisterIds[network];
};
