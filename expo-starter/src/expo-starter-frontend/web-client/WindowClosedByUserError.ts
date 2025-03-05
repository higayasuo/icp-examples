/**
 * Error thrown when a window is closed by the user before completing its intended operation
 * @extends Error
 */
export class WindowClosedByUserError extends Error {
  constructor(message = 'Window was closed by user') {
    super(message);
    this.name = 'WindowClosedByUserError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}
