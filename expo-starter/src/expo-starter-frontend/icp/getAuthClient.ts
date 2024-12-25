import { AuthClient } from '@dfinity/auth-client';

/**
 * Singleton instance of AuthClient.
 */
let authClient: AuthClient | undefined;

/**
 * Get or create an instance of AuthClient.
 *
 * @returns {Promise<AuthClient>} - A promise that resolves to an instance of AuthClient.
 */
export const getAuthClient = async (): Promise<AuthClient> => {
  if (authClient) {
    return authClient;
  }

  authClient = await AuthClient.create();

  return authClient;
};
