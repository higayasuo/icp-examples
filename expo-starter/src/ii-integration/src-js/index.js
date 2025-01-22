import { SignIdentity, fromHex, } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Ed25519PublicKey } from "@dfinity/identity";
const formatError = (prefix, error) => {
    return `Internet Identity ${prefix}: ${error instanceof Error ? error.message : String(error)}`;
};
const renderError = (message) => {
    const errorElement = document.querySelector("#error");
    if (!errorElement) {
        console.error("Error element not found");
        return;
    }
    errorElement.textContent = message;
    errorElement.style.display = message ? "block" : "none";
};
const parseParams = () => {
    const url = new URL(window.location.href);
    const redirectUri = url.searchParams.get("redirect_uri") || "";
    const pubKey = url.searchParams.get("pubkey");
    const iiUri = url.searchParams.get("ii_uri");
    if (!redirectUri || !pubKey || !iiUri) {
        const error = new Error("Missing redirect_uri, pubkey, or ii_uri in query string");
        renderError(error.message);
        throw error;
    }
    const identity = new PublicKeyOnlyIdentity(Ed25519PublicKey.fromDer(fromHex(pubKey)));
    return { redirectUri, identity, iiUri };
};
const buildRedirectURLWithDelegation = (redirectUri, delegationIdentity) => {
    const delegationString = JSON.stringify(delegationIdentity.getDelegation().toJSON());
    const encodedDelegation = encodeURIComponent(delegationString);
    return `${redirectUri}?delegation=${encodedDelegation}`;
};
const main = async () => {
    try {
        const { redirectUri, identity, iiUri } = parseParams();
        const authClient = await AuthClient.create({ identity });
        const loginButton = document.querySelector("#ii-login-button");
        loginButton.addEventListener("click", async () => {
            renderError("");
            try {
                await authClient.login({
                    identityProvider: iiUri,
                    onSuccess: () => {
                        try {
                            renderError("");
                            const delegationIdentity = authClient.getIdentity();
                            const url = buildRedirectURLWithDelegation(redirectUri, delegationIdentity);
                            window.location.href = url;
                        }
                        catch (error) {
                            renderError(formatError("delegation retrieval failed", error));
                        }
                    },
                    onError: (error) => {
                        renderError(formatError("authentication rejected", error || "Unknown error"));
                    },
                });
            }
            catch (error) {
                renderError(formatError("login process failed", error));
            }
        });
    }
    catch (error) {
        renderError(formatError("initialization failed", error));
    }
};
class PublicKeyOnlyIdentity extends SignIdentity {
    constructor(publicKey) {
        super();
        this._publicKey = publicKey;
    }
    getPublicKey() {
        return this._publicKey;
    }
    async sign(blob) {
        throw new Error("Cannot sign with incomplete identity");
    }
}
window.addEventListener("DOMContentLoaded", () => {
    main();
});
