/**
 * Error thrown when a window fails to open
 * @extends Error
 */
export class WindowOpenError extends Error {
  constructor(message = 'Failed to open window') {
    super(message);
    this.name = 'WindowOpenError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}
