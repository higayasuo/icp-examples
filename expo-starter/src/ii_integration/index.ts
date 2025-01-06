import {
  AnonymousIdentity,
  SignIdentity,
  fromHex,
  toHex,
  Signature,
  Identity,
} from "@dfinity/agent";
import { Ed25519KeyIdentity, Ed25519PublicKey } from "@dfinity/identity";
import { defineElement, IILoginButton } from "@dfinity/ii-login-button";

async function main(): Promise<void> {
  // initialize the login button
  defineElement();

  const loginButton = document.querySelector("ii-login-button") as IILoginButton;
  loginButton.addEventListener("ready", () => {
    try {
      const { redirectUri, identity } = parseParams();
      console.log('redirectUri:', redirectUri);
      console.log('identity:', identity);
      loginButton.configure({
        createOptions: {
          identity,
        },
        loginOptions: {
          onSuccess: () => {
            const loginButton = document.querySelector("ii-login-button") as IILoginButton;
            const delegationIdentity = loginButton.identity;

            if (!delegationIdentity) {
              throw new Error("No delegation identity found");
            }

            // Type assertion as any to bypass the type check
            const delegation = (delegationIdentity as any).getDelegation();
            const delegationString = JSON.stringify(
              delegation.toJSON()
            );

            const encodedDelegation = encodeURIComponent(delegationString);
            const url = `${redirectUri}?delegation=${encodedDelegation}`;
            console.log(`Redirecting to ${url}`);

            const button = document.createElement("button");
            button.innerText = "Continue";
            button.addEventListener("click", () => {
              window.open(url, "_self");
            });
            document.body.appendChild(button);
          },
          onError: (error?: string) => {
            console.log(error);
            renderError(new Error(error || "Unknown error"));
          },
        },
      });
    } catch (error) {
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
}

function parseParams(): ParsedParams {
  const url = new URL(window.location.href);
  const redirectUri = decodeURIComponent(url.searchParams.get("redirect_uri") || "");
  const pubKey = url.searchParams.get("pubkey");

  if (!redirectUri || !pubKey) {
    const error = new Error("Missing redirect_uri or pubkey in query string");
    renderError(error);
    throw error;
  }

  const identity = new IncompleteEd25519KeyIdentity(
    Ed25519PublicKey.fromDer(fromHex(pubKey))
  );

  return { redirectUri, identity };
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