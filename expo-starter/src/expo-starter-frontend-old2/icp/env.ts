import envTxt from './env.txt';

/**
 * Reads and parses the environment variables from env.txt file.
 * This function is platform-independent and works on both Unix and Windows.
 * @returns {Record<string, string>} An object containing the environment variables
 */
export const reqdEnvFile = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch(envTxt);
    const text = await response.text();
    const envVars: Record<string, string> = {};

    // Split by both \n and \r\n to support both Unix and Windows
    const lines = text.split(/\r?\n/);

    lines.forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        // Remove quotes if they exist
        const cleanValue = value.replace(/^['"]|['"]$/g, '');
        if (key && cleanValue) {
          envVars[key.trim()] = cleanValue;
        }
      }
    });

    return envVars;
  } catch (error) {
    console.error('Error reading env.txt file:', error);
    return {};
  }
};
