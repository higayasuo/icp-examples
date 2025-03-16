var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PublicKeyOnlyIdentity_publicKey;
import { SignIdentity, fromHex } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Ed25519PublicKey } from '@dfinity/identity';
class PublicKeyOnlyIdentity extends SignIdentity {
    constructor(publicKey) {
        super();
        _PublicKeyOnlyIdentity_publicKey.set(this, void 0);
        __classPrivateFieldSet(this, _PublicKeyOnlyIdentity_publicKey, publicKey, "f");
    }
    getPublicKey() {
        return __classPrivateFieldGet(this, _PublicKeyOnlyIdentity_publicKey, "f");
    }
    async sign(blob) {
        throw new Error('Cannot sign with public key only identity');
    }
}
_PublicKeyOnlyIdentity_publicKey = new WeakMap();
const formatError = (prefix, error) => {
    return `Internet Identity ${prefix}: ${error instanceof Error ? error.message : String(error)}`;
};
const renderError = (message) => {
    const errorElement = document.querySelector('#error');
    if (!errorElement) {
        console.error('Error element not found');
        return;
    }
    errorElement.textContent = message;
    errorElement.style.display = message ? 'block' : 'none';
};
const parseParams = () => {
    const url = new URL(window.location.href);
    const redirectUri = url.searchParams.get('redirect_uri');
    const pubKey = url.searchParams.get('pubkey');
    const iiUri = url.searchParams.get('ii_uri');
    if (!redirectUri || !pubKey || !iiUri) {
        const error = new Error('Missing redirect_uri, pubkey, or ii_uri in query string');
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
        const loginButton = document.querySelector('#ii-login-button');
        loginButton.addEventListener('click', async () => {
            renderError('');
            try {
                await authClient.login({
                    identityProvider: iiUri,
                    onSuccess: () => {
                        try {
                            const delegationIdentity = authClient.getIdentity();
                            if (window.parent) {
                                // Check if we're in an iframe (web browser case)
                                const isIframe = window.parent !== window;
                                if (isIframe) {
                                    // We're in a web browser iframe
                                    console.log('Web browser detected, using postMessage');
                                    const message = {
                                        kind: 'success',
                                        delegation: JSON.stringify(delegationIdentity.getDelegation().toJSON()),
                                    };
                                    window.parent.postMessage(message, new URL(redirectUri).origin);
                                }
                                else {
                                    // We're in a native app's WebView
                                    console.log('Native app detected, using URL redirection');
                                    const url = buildRedirectURLWithDelegation(redirectUri, delegationIdentity);
                                    console.log('Redirect URL:', url);
                                    try {
                                        window.location.href = url;
                                    }
                                    catch (redirectError) {
                                        console.error('Redirect error:', redirectError);
                                        // Try alternative redirection method
                                        window.location.replace(url);
                                    }
                                }
                            }
                            else {
                                throw new Error('No parent window found');
                            }
                        }
                        catch (error) {
                            renderError(formatError('delegation retrieval failed', error));
                        }
                    },
                    onError: (error) => {
                        renderError(formatError('authentication rejected', error || 'Unknown error'));
                    },
                });
            }
            catch (error) {
                renderError(formatError('login process failed', error));
            }
        });
    }
    catch (error) {
        renderError(formatError('initialization failed', error));
    }
};
window.addEventListener('DOMContentLoaded', () => {
    main();
});
