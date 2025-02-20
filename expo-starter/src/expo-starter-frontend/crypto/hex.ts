/**
 * Convert Uint8Array to hex string
 */
export const toHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Convert hex string to Uint8Array
 */
export const fromHex = (hex: string): Uint8Array => {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
};
