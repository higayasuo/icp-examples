/**
 * Checks if the current environment supports subdomains.
 *
 * This function attempts to create a URL object with a subdomain.
 * If the creation is successful, it implies that subdomains are supported.
 * If an error is thrown, it indicates that subdomains are not supported.
 *
 * @returns {boolean} - True if subdomains are supported, false otherwise.
 */
export const isSubdomainSupported = (): boolean => {
  try {
    new URL('http://test.localhost');
    return true;
  } catch (e) {
    return false;
  }
};
