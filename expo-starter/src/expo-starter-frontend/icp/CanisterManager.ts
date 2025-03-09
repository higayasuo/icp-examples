import {
  Actor,
  HttpAgent,
  ActorSubclass,
  Identity,
  AnonymousIdentity,
} from '@dfinity/agent';
import { IDL } from '@dfinity/candid';

type CanisterManagerConfig = {
  dfxNetwork: string;
  localReplicaHostForSSL: string;
  replicaPort?: number;
  canisterPort?: number;
  internetIdentityPort?: number;
};

type CreateActorParams = {
  canisterId: string;
  interfaceFactory: IDL.InterfaceFactory;
  identity?: Identity;
};

export class CanisterManager {
  private dfxNetwork: string;
  private localReplicaHostForSSL: string;
  private replicaPort: number;
  private canisterPort: number;
  private internetIdentityPort: number;

  constructor({
    dfxNetwork,
    localReplicaHostForSSL,
    replicaPort = 4943,
    canisterPort = 14943,
    internetIdentityPort = 24943,
  }: CanisterManagerConfig) {
    this.dfxNetwork = dfxNetwork;
    this.localReplicaHostForSSL = localReplicaHostForSSL;
    this.replicaPort = replicaPort;
    this.canisterPort = canisterPort;
    this.internetIdentityPort = internetIdentityPort;
  }

  createActor = <T>({
    canisterId,
    interfaceFactory,
    identity = new AnonymousIdentity(),
  }: CreateActorParams): ActorSubclass<T> => {
    const host = this.getBackendCanisterURL(canisterId);

    const httpAgentOptions = {
      host,
      identity,
      // fetchOptions: {
      //   reactNative: {
      //     __nativeResponseType: 'base64',
      //   },
      // },
      // callOptions: {
      //   reactNative: {
      //     textStreaming: true,
      //   },
      // },
    };

    const agent = new HttpAgent(httpAgentOptions);

    if (this.dfxNetwork === 'local') {
      agent.fetchRootKey().catch((err) => {
        console.warn(`Your local replica is not running: ${host}`);
        console.error(err);
        throw err;
      });
    }

    return Actor.createActor<T>(interfaceFactory, {
      agent,
      canisterId,
    });
  };

  getBackendCanisterURL = (canisterId: string): string => {
    if (this.dfxNetwork !== 'local') {
      return `https://${canisterId}.ic0.app`;
    }

    return `https://${this.localReplicaHostForSSL}:${this.canisterPort}/?canisterId=${canisterId}`;
  };

  getFrontendCanisterURL = (canisterId: string): string => {
    if (this.dfxNetwork !== 'local') {
      return `https://${canisterId}.ic0.app`;
    }

    if (this.isLocalhostSubdomainSupported()) {
      return this.getLocalhostSubdomainCanisterURL(canisterId);
    }

    return `https://${this.localReplicaHostForSSL}:${this.canisterPort}/?canisterId=${canisterId}`;
  };

  getInternetIdentityURL = (canisterId: string): string => {
    if (this.dfxNetwork !== 'local') {
      return 'https://identity.ic0.app';
    }

    if (this.isLocalhostSubdomainSupported()) {
      return this.getLocalhostSubdomainCanisterURL(canisterId);
    }

    return `https://${this.localReplicaHostForSSL}:${this.internetIdentityPort}/?canisterId=${canisterId}`;
  };

  isLocalhostSubdomainSupported = (): boolean => {
    if (!window?.location?.origin?.includes('localhost')) {
      return false;
    }

    const userAgent = window?.navigator?.userAgent?.toLowerCase() || '';

    // Chrome has built-in support for localhost subdomains
    if (userAgent.includes('chrome')) {
      return true;
    }

    // Safari and other browsers are not supported
    return false;
  };

  getLocalhostSubdomainCanisterURL = (canisterId: string): string => {
    return `http://${canisterId}.localhost:${this.replicaPort}`;
  };
}
