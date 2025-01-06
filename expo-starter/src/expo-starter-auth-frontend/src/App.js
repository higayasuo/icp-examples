import { html, render } from 'lit-html';
import logo from './logo2.svg';
import {AuthClient} from "@dfinity/auth-client";
import {HttpAgent} from "@dfinity/agent";
import {DelegationIdentity, Ed25519PublicKey, Ed25519KeyIdentity, ECDSAKeyIdentity, DelegationChain} from "@dfinity/identity";

class App {
  constructor() {
    this.#initializeState();
    this.#render();
  }

  #initializeState() {
    this.delegationChain = null;
    this.appPublicKey = null;
    this.keyIdentity = null;  // Store the full key identity

    const url = window.location.href;
    const publicKeyIndex = url.indexOf("sessionkey=");
    if (publicKeyIndex !== -1) {
      const publicKeyString = url.substring(publicKeyIndex + "sessionkey=".length);
      const bytes = new Uint8Array(
        publicKeyString.match(/../g).reduce((acc, byte) => [...acc, parseInt(byte, 16)], [])
      );
      this.appPublicKey = Ed25519PublicKey.fromDer(bytes);
    } else {
      // Generate a new Ed25519 key pair and store it
      this.keyIdentity = Ed25519KeyIdentity.generate();
      this.appPublicKey = this.keyIdentity.getPublicKey();
      const derBytes = this.appPublicKey.toDer();
      const derPublicKey = Array.from(new Uint8Array(derBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      console.log('Generated public key (DER format):', derPublicKey);
    }
  }

  #reconstructIdentity(delegationString) {
    // Parse the delegation chain from JSON
    const delegationChain = DelegationChain.fromJSON(JSON.parse(delegationString));

    if (!this.keyIdentity) {
      throw new Error("App key identity not available");
    }

    // Create a delegation identity using the stored key identity
    const identity = new DelegationIdentity(this.keyIdentity, delegationChain);

    return identity;
  }

  #handleLogin = async (e) => {
    e.preventDefault();

    // Create an auth client
    const authClient = await AuthClient.create();

    // Start the login process and wait for it to finish
    await new Promise((resolve) => {
      authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: resolve,
      });
    });

    // Get the identity from the auth client
    const identity = authClient.getIdentity();

    // Create an agent with the identity
    const agent = new HttpAgent({ identity });

    // Create delegation chain for the app's public key
    if (this.appPublicKey) {
      const delegationChain = await DelegationChain.create(
        identity,
        this.appPublicKey,
        new Date(Date.now() + 15 * 60 * 1000)  // 15 minutes
      );

      // Redirect to the app with the delegation
      let url = "internetidentity://authorize?";
      url = url + "delegation=" + encodeURIComponent(JSON.stringify(delegationChain.toJSON()));
      window.open(url, "_self");
    }

    return false;
  };

  #handleOpen = async (e) => {
    e.preventDefault();

    if (this.delegationChain == null) {
      console.log("Invalid delegation chain.");
      return false;
    }

    let url = "internetidentity://authorize?";
    const delegationString = JSON.stringify(this.delegationChain.toJSON());
    url = url + "delegation=" + encodeURIComponent(delegationString);

    // Example of how to reconstruct identity from delegation string
    // const identity = this.#reconstructIdentity(delegationString);
    // const agent = new HttpAgent({ identity });

    window.open(url, "_self");
    return false;
  };

  #render() {
    let body = html`
      <main>
        <img src="${logo}" alt="DFINITY logo" />
        <br />
        <br />
        <form>
          <button id="login" @click="${this.#handleLogin}">Login with Internet Identity</button>
        </form>
        <br />
        <form>
          <button id="open" @click="${this.#handleOpen}">Launch Application by DeepLink</button>
        </form>
        <br />
      </main>
    `;
    render(body, document.getElementById('root'));
  }
}

export default App;
