/**
 * Compare two Uint8Arrays for equality
 * @param a First array
 * @param b Second array
 * @returns true if arrays are equal, false otherwise
 */
export function compareUint8Arrays(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}
