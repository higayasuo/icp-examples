import { Actor, HttpAgent, ActorSubclass, Identity } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';

import { ENV_VARS } from './env.generated';
import { getCanisterURL } from './getCanisterURL';

/**
 * Parameters for creating an actor.
 */
type CreateActorParams = {
  canisterId: string;
  interfaceFactory: IDL.InterfaceFactory;
  identity: Identity;
};

/**
 * Creates an actor for interacting with a canister.
 * @template T
 * @param {CreateActorParams} params - The parameters for creating the actor.
 * @returns {ActorSubclass<T>} - The created actor.
 */
export function createActor<T>({
  canisterId,
  interfaceFactory,
  identity,
}: CreateActorParams): ActorSubclass<T> {
  const httpAgentOptions = {
    host: getCanisterURL(canisterId),
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

  if (ENV_VARS.DFX_NETWORK === 'local') {
    agent.fetchRootKey().catch((err) => {
      console.warn('Your local replica is not running');
      console.error(err);
    });
  }

  return Actor.createActor<T>(interfaceFactory, {
    agent,
    canisterId,
  });
}
