import { SignIdentity, fromHex, Signature, PublicKey } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { DelegationIdentity, Ed25519PublicKey } from '@dfinity/identity';

class PublicKeyOnlyIdentity extends SignIdentity {
  #publicKey: PublicKey;

  constructor(publicKey: PublicKey) {
    super();
    this.#publicKey = publicKey;
  }

  getPublicKey(): PublicKey {
    return this.#publicKey;
  }

  async sign(blob: ArrayBuffer): Promise<Signature> {
    throw new Error('Cannot sign with public key only identity');
  }
}

const formatError = (prefix: string, error: unknown): string => {
  return `Internet Identity ${prefix}: ${
    error instanceof Error ? error.message : String(error)
  }`;
};

const renderError = (message: string): void => {
  const errorElement = document.querySelector('#error') as HTMLParagraphElement;
  if (!errorElement) {
    console.error('Error element not found');
    return;
  }

  errorElement.textContent = message;
  errorElement.style.display = message ? 'block' : 'none';
};

interface ParsedParams {
  redirectUri: string;
  identity: SignIdentity;
  iiUri: string;
}

const parseParams = (): ParsedParams => {
  const url = new URL(window.location.href);
  const redirectUri = url.searchParams.get('redirect_uri');
  const pubKey = url.searchParams.get('pubkey');
  const iiUri = url.searchParams.get('ii_uri');

  if (!redirectUri || !pubKey || !iiUri) {
    const error = new Error(
      'Missing redirect_uri, pubkey, or ii_uri in query string',
    );
    renderError(error.message);
    throw error;
  }

  const identity = new PublicKeyOnlyIdentity(
    Ed25519PublicKey.fromDer(fromHex(pubKey)),
  );

  return { redirectUri, identity, iiUri };
};

const buildRedirectURLWithDelegation = (
  redirectUri: string,
  delegationIdentity: DelegationIdentity,
): string => {
  const delegationString = JSON.stringify(
    delegationIdentity.getDelegation().toJSON(),
  );
  const encodedDelegation = encodeURIComponent(delegationString);
  return `${redirectUri}?delegation=${encodedDelegation}`;
};

const main = async (): Promise<void> => {
  try {
    const { redirectUri, identity, iiUri } = parseParams();
    const authClient = await AuthClient.create({ identity });
    const loginButton = document.querySelector(
      '#ii-login-button',
    ) as HTMLButtonElement;

    loginButton.addEventListener('click', async () => {
      renderError('');
      try {
        await authClient.login({
          identityProvider: iiUri,
          onSuccess: () => {
            try {
              const delegationIdentity =
                authClient.getIdentity() as DelegationIdentity;

              if (window.parent) {
                // Check if we're in an iframe (web browser case)
                const isIframe = window.parent !== window;

                if (isIframe) {
                  // We're in a web browser iframe
                  console.log('Web browser detected, using postMessage');
                  const message = {
                    kind: 'success',
                    delegation: JSON.stringify(
                      delegationIdentity.getDelegation().toJSON(),
                    ),
                  };
                  window.parent.postMessage(
                    message,
                    new URL(redirectUri).origin,
                  );
                } else {
                  // We're in a native app's WebView
                  console.log('Native app detected, using URL redirection');
                  const url = buildRedirectURLWithDelegation(
                    redirectUri,
                    delegationIdentity,
                  );
                  console.log('Redirect URL:', url);
                  try {
                    window.location.href = url;
                  } catch (redirectError) {
                    console.error('Redirect error:', redirectError);
                    // Try alternative redirection method
                    window.location.replace(url);
                  }
                }
              } else {
                throw new Error('No parent window found');
              }
            } catch (error) {
              renderError(formatError('delegation retrieval failed', error));
            }
          },
          onError: (error?: string) => {
            renderError(
              formatError('authentication rejected', error || 'Unknown error'),
            );
          },
        });
      } catch (error) {
        renderError(formatError('login process failed', error));
      }
    });
  } catch (error) {
    renderError(formatError('initialization failed', error));
  }
};

window.addEventListener('DOMContentLoaded', () => {
  main();
});
