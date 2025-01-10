const PORT = 4943;

export const getLocalCanisterSubdomainURL = (canisterId: string): string => {
  return `http://${canisterId}.localhost:${PORT}`;
};
