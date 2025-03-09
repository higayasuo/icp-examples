import { Actor, HttpAgent, ActorSubclass, Identity } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';
import { AnonymousIdentity } from '@dfinity/agent';

/**
 * Parameters for creating an actor.
 */
type CreateActorParams = {
  canisterUrl: string;
  canisterId: string;
  dfxNetwork: string;
  interfaceFactory: IDL.InterfaceFactory;
  identity?: Identity;
};

/**
 * Creates an actor for interacting with a canister.
 * @template T
 * @param {CreateActorParams} params - The parameters for creating the actor.
 * @returns {ActorSubclass<T>} - The created actor.
 */
export function createActor<T>({
  canisterUrl,
  canisterId,
  interfaceFactory,
  dfxNetwork,
  identity = new AnonymousIdentity(),
}: CreateActorParams): ActorSubclass<T> {
  const httpAgentOptions = {
    host: canisterUrl,
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

  if (dfxNetwork === 'local') {
    agent.fetchRootKey().catch((err) => {
      console.warn(`Your local replica is not running: ${canisterUrl}`);
      console.error(err);
      throw err;
    });
  }

  return Actor.createActor<T>(interfaceFactory, {
    agent,
    canisterId,
  });
}
