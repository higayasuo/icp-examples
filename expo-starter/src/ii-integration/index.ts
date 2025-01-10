import {
  SignIdentity,
  fromHex,
  Signature,
}
  from "@dfinity/agent";
import { Ed25519PublicKey } from "@dfinity/identity";
import { defineElement, IILoginButton } from "@dfinity/ii-login-button";

async function main(): Promise<void> {
  console.log('Starting main function');
  // initialize the login button
  defineElement();

  const loginButton = document.querySelector("ii-login-button") as IILoginButton;
  console.log('Login button found:', loginButton);

  loginButton.addEventListener("ready", () => {
    console.log('Login button ready event fired');
    try {
      const { redirectUri, identity, iiUri } = parseParams();
      console.log('Parsed params:', {
        redirectUri,
        identity: identity ? 'Identity present' : 'No identity',
        iiUri
      });

      loginButton.configure({
        createOptions: {
          identity,
        },
        loginOptions: {
          identityProvider: iiUri,
          windowOpenerFeatures:
            "toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100",
          onSuccess: () => {
            console.log('Login success callback triggered');
            console.log('iiUri:', iiUri);
            const loginButton = document.querySelector("ii-login-button") as IILoginButton;
            const delegationIdentity = loginButton.identity;
            console.log('Delegation identity:', delegationIdentity ? 'Present' : 'Not present');

            if (!delegationIdentity) {
              throw new Error("No delegation identity found");
            }

            // Type assertion as any to bypass the type check
            const delegation = (delegationIdentity as any).getDelegation();
            console.log('Delegation obtained:', delegation ? 'Present' : 'Not present');
            const delegationString = JSON.stringify(
              delegation.toJSON()
            );
            console.log('Delegation JSON created');

            const encodedDelegation = encodeURIComponent(delegationString);
            const url = `${redirectUri}?delegation=${encodedDelegation}`;
            console.log(`Prepared redirect URL: ${url}`);

            const button = document.createElement("button");
            button.innerText = "Continue";
            button.addEventListener("click", () => {
              console.log('Continue button clicked, redirecting...');
              window.open(url, "_self");
            });
            document.body.appendChild(button);
          },
          onError: (error?: string) => {
            console.log('Login error callback triggered:', error);
            renderError(new Error(error || "Unknown error"));
          },
        },
      });
      console.log('Login button configured');
    } catch (error) {
      console.error('Error in ready event handler:', error);
      if (error instanceof Error) {
        renderError(error);
      }
    }
  });
}

class IncompleteEd25519KeyIdentity extends SignIdentity {
  private _publicKey: Ed25519PublicKey;

  constructor(publicKey: Ed25519PublicKey) {
    super();
    this._publicKey = publicKey;
  }

  getPublicKey(): Ed25519PublicKey {
    return this._publicKey;
  }

  async sign(blob: ArrayBuffer): Promise<Signature> {
    throw new Error("Cannot sign with incomplete identity");
  }
}

interface ParsedParams {
  redirectUri: string;
  identity: SignIdentity;
  iiUri: string;
}

function parseParams(): ParsedParams {
  const url = new URL(window.location.href);
  const redirectUri = url.searchParams.get("redirect_uri") || "";
  const pubKey = url.searchParams.get("pubkey");
  const iiUri = url.searchParams.get("ii_uri");

  if (!redirectUri || !pubKey || !iiUri) {
    const error = new Error("Missing redirect_uri, pubkey, or ii_uri in query string");
    renderError(error);
    throw error;
  }

  const identity = new IncompleteEd25519KeyIdentity(
    Ed25519PublicKey.fromDer(fromHex(pubKey))
  );

  return { redirectUri, identity, iiUri };
}

window.addEventListener("DOMContentLoaded", () => {
  main();
});

export function renderError(error: Error): void {
  const errorContainer = document.querySelector("#error-container");
  if (!errorContainer) {
    console.error("Error container not found");
    return;
  }

  const existingError = document.querySelector("#error");
  if (existingError) {
    existingError.remove();
  }

  const errorText = document.createElement("p");
  errorText.style.color = "red";
  errorText.id = "error";
  errorText.innerText = error.message;
  errorContainer.appendChild(errorText);
}