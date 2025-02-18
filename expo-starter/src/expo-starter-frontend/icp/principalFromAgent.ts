import { Agent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

export const principalFromAgent = async (
  agent: Agent | undefined,
): Promise<Principal> => {
  if (!agent) {
    return Principal.anonymous();
  }
  return agent.getPrincipal();
};
