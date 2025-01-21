const PORT = 4943;

export const getCanisterLocalhostSubdomainURL = (
  canisterId: string,
): string => {
  return `http://${canisterId}.localhost:${PORT}`;
};
