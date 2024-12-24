import { AuthClient } from '@dfinity/auth-client';

let authClient: AuthClient | undefined = undefined;

// const setupLogin = async (authClient: AuthClient) => {
//   await authClient.login({
//     identityProvider: 'https://identity.ic0.app/#authorize',
//     onSuccess: () => {
//       console.log('Login successful');
//     },
//   });
// };

export const getAuthClient = async () => {
  if (authClient) {
    return authClient;
  }

  authClient = await AuthClient.create();

  return authClient;
};
