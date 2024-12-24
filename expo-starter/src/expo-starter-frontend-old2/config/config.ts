/**
 * Configuration type definition.
 * @typedef {Object} Config
 * @property {string} backendCanisterId - The ID of the backend canister.
 */
type Config = {
  backendCanisterId: string;
};

/**
 * Configuration settings for different profiles.
 * @type {Object.<string, Config>}
 */
const configs: { [profileName: string]: Config } = {
  development: {
    backendCanisterId: 'bkyz2-fmaaa-aaaaa-qaaaq-cai',
  },
  preview: {
    backendCanisterId: '',
  },
  production: {
    backendCanisterId: '',
  },
};

/**
 * Retrieves the current profile name from the environment variables.
 * Defaults to 'development' if not set.
 * @returns {string} The profile name.
 */
export const getProfileName = () =>
  process.env.EAS_BUILD_PROFILE || 'development';

/**
 * Retrieves the configuration for the current profile.
 * Throws an error if the profile name is invalid.
 * @returns {Config} The configuration object for the current profile.
 * @throws {Error} If the profile name is invalid.
 */
export const getConfig = () => {
  const config = configs[getProfileName()];

  if (!config) {
    throw new Error('Invalid profile name');
  }

  return config;
};
