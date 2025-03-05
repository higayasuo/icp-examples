/**
 * Error thrown when a message event's origin does not match the expected origin
 * @extends Error
 */
export class OriginMismatchError extends Error {
  constructor(public expectedOrigin: string, public actualOrigin: string) {
    super(`Expected origin ${expectedOrigin}, got ${actualOrigin}`);
    this.name = 'OriginMismatchError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}
