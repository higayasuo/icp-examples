import { OriginMismatchError } from './OriginMismatchError';
import { WindowClosedByUserError } from './WindowClosedByUserError';
import { WindowOpenError } from './WindowOpenError';

const INTERRUPT_CHECK_INTERVAL = 500;

export type ErrorFunc = (error: Error) => void;

export interface WebClientOpenOptions {
  url: string;
  windowOpenerFeatures?: string;
}

export class WebClient<T extends { kind: string }> {
  private errorFunc: ErrorFunc;
  private handlers: Partial<Record<T['kind'], (response: T) => void>> = {};
  private webClientWindow?: Window;
  private eventHandler?: (event: MessageEvent<T>) => void;

  constructor(errorFunc: ErrorFunc = console.error) {
    this.errorFunc = errorFunc;
  }

  on<K extends T['kind']>(
    kind: K,
    handler: (response: Extract<T, { kind: K }>) => void,
  ): this {
    this.handlers[kind] = handler as (response: T) => void;
    return this;
  }

  handleEvent(event: MessageEvent<T>): void {
    const data = event.data;

    if (this.isValidMessageData(data)) {
      const handler = this.handlers[data.kind as T['kind']];

      if (handler) {
        handler(data);
      } else {
        console.warn(`No handler registered for message kind: ${data.kind}`);
      }
    } else {
      console.warn('Invalid message format:', data);
    }
  }

  private isValidMessageData(data: unknown): data is T {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const message = data as { kind?: unknown };
    return 'kind' in data && typeof message.kind === 'string';
  }

  public async open({
    url,
    windowOpenerFeatures,
  }: WebClientOpenOptions): Promise<void> {
    const targetUrl = new URL(url);

    this.close();

    this.setupEventHandler(targetUrl);

    this.webClientWindow =
      window.open(
        targetUrl.toString(),
        'webClientWindow',
        windowOpenerFeatures,
      ) ?? undefined;

    if (!this.webClientWindow) {
      this.handleError(new WindowOpenError());
      return;
    }

    // Check if the window is closed by user.
    const checkInterruption = (): void => {
      if (this.webClientWindow) {
        if (this.webClientWindow.closed) {
          this.handleError(new WindowClosedByUserError());
        } else {
          setTimeout(checkInterruption, INTERRUPT_CHECK_INTERVAL);
        }
      }
    };
    checkInterruption();
  }

  public async close(): Promise<void> {
    this.webClientWindow?.close();
    this.removeEventHandler();
    delete this.webClientWindow;
  }

  setupEventHandler(targetURL: URL): void {
    this.eventHandler = (event: MessageEvent<T>) => {
      try {
        if (window?.location?.origin === event.origin) {
          return;
        }

        if (event.origin !== targetURL.origin) {
          console.log('event', event);
          throw new OriginMismatchError(targetURL.origin, event.origin);
        }

        this.handleEvent(event);
      } catch (error) {
        const e =
          typeof error === 'string'
            ? new Error(error)
            : error instanceof Error
            ? error
            : new Error(String(error));
        this.handleError(e);
      }
    };
    window.addEventListener('message', this.eventHandler as EventListener);
  }

  removeEventHandler(): void {
    if (this.eventHandler) {
      window.removeEventListener('message', this.eventHandler as EventListener);
      this.eventHandler = undefined;
    }
  }

  handleError(error: Error): void {
    this.close();
    this.errorFunc(error);
  }
}
