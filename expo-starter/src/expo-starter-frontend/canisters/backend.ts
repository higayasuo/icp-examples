import { getConfig } from '../config';
import { createActor } from './actorUtils';

import { _SERVICE } from './expo-starter-backend.did';

/**
 * Retrieves the backend canister ID from the configuration.
 * @type {string}
 */
const backendCanisterId = getConfig().backendCanisterId;

/**
 * The IDL factory for the backend canister.
 * @type {Object}
 */
const idlFactory = require('./expo-starter-backend.did.js').idlFactory;

/**
 * The backend actor instance.
 * @type {_SERVICE}
 */
export const backend = createActor<_SERVICE>(backendCanisterId, idlFactory);
