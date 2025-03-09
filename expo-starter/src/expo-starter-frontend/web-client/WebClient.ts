import { OriginMismatchError } from './OriginMismatchError';
import { WindowOpenError } from './WindowOpenError';

export type ErrorFunc = (error: Error) => void;

export interface WebClientOpenOptions {
  url: string;
}

export class WebClient<T extends { kind: string }> {
  private errorFunc: ErrorFunc;
  private handlers: Partial<Record<T['kind'], (response: T) => void>> = {};
  private iframe?: HTMLIFrameElement;
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
        // Let the handler manage the window state
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

  public async open({ url }: WebClientOpenOptions): Promise<void> {
    const targetUrl = new URL(url);

    this.close();

    this.setupEventHandler(targetUrl);

    // Create container div for the iframe
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    container.style.zIndex = '2147483646';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';

    // Create a wrapper for iframe and close button
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '400px';
    wrapper.style.height = '600px';

    // Create the iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.style.borderRadius = '8px';
    this.iframe.style.backgroundColor = 'white';
    this.iframe.src = targetUrl.toString();

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '-16px';
    closeButton.style.right = '-16px';
    closeButton.style.fontSize = '24px';
    closeButton.style.width = '32px';
    closeButton.style.height = '32px';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.background = 'white';
    closeButton.style.color = '#333';
    closeButton.style.cursor = 'pointer';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    closeButton.style.zIndex = '2147483647';
    closeButton.onclick = () => this.close();

    // Add elements to DOM
    wrapper.appendChild(this.iframe);
    wrapper.appendChild(closeButton);
    container.appendChild(wrapper);
    document.body.appendChild(container);

    if (!this.iframe) {
      this.handleError(new WindowOpenError());
      return;
    }
  }

  public async close(): Promise<void> {
    if (this.iframe) {
      const container = this.iframe.parentElement?.parentElement;
      if (container && container.parentElement) {
        container.parentElement.removeChild(container);
      }
      delete this.iframe;
    }
    this.removeEventHandler();
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
