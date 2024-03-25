import { createActor, canisterId } from '../../../declarations/backend';

export const host =
	process.env.DFX_NETWORK == 'local' ? `http://localhost:4943` : `https://${canisterId}.ic0.app`;

export const backend = createActor(canisterId, { agentOptions: { host } });
