import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { WebClient } from '../WebClient';
import { OriginMismatchError } from '../OriginMismatchError';
import { WindowOpenError } from '../WindowOpenError';

type TestSuccessResponse = {
  kind: 'test';
  value: string;
};

type TestErrorResponse = {
  kind: 'error';
  message: string;
};

type TestResponse = TestSuccessResponse | TestErrorResponse;

// Concrete implementation of WebClient for testing
class TestWebClient extends WebClient<TestResponse> {
  // handleEvent(event: MessageEvent<TestResponse>): void {
  //   super.handleEvent(event);
  // }
}

describe('WebClient', () => {
  let webClient: TestWebClient;
  let errorFunc: Mock;

  beforeEach(() => {
    // Mock window.open
    vi.spyOn(window, 'open').mockImplementation(() => {
      return {
        close: vi.fn(),
        closed: false,
      } as unknown as Window;
    });

    errorFunc = vi.fn();
    webClient = new TestWebClient(errorFunc);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    webClient.close();
  });

  it('should open a window with correct URL', async () => {
    const url = 'https://example.com';
    await webClient.open({ url });

    expect(window.open).toHaveBeenCalledWith(
      new URL(url).toString(),
      'webClientWindow',
      undefined,
    );
  });

  it('should handle window open error', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    const url = 'https://example.com';
    await webClient.open({ url });

    expect(errorFunc).toHaveBeenCalledWith(expect.any(WindowOpenError));
  });

  it('should handle origin mismatch error', () => {
    const targetUrl = new URL('https://example.com');
    webClient.setupEventHandler(targetUrl);

    const event = new MessageEvent('message', {
      origin: 'https://malicious.com',
      data: { kind: 'test', value: 'test-value' } satisfies TestSuccessResponse,
    });

    window.dispatchEvent(event);

    expect(errorFunc).toHaveBeenCalledWith(expect.any(OriginMismatchError));
  });

  it('should handle messages with registered handlers', () => {
    const targetUrl = new URL('https://example.com');
    const handler = vi.fn();
    const testData: TestSuccessResponse = {
      kind: 'test',
      value: 'test-value',
    };

    webClient.on('test', handler);
    webClient.setupEventHandler(targetUrl);

    const event = new MessageEvent('message', {
      origin: 'https://example.com',
      data: testData,
    });

    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith(testData);
  });

  it('should clean up resources on close', async () => {
    const url = 'https://example.com';
    await webClient.open({ url });

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    webClient.close();

    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  it('type-safety check', async () => {
    webClient.on('test', (data) => {
      console.log(data.value);
    });

    webClient.on('error', (data) => {
      console.log(data.message);
    });

    const handler = (data: TestResponse) => {
      if (data.kind === 'test') {
        console.log(data.value);
      } else {
        console.log(data.message);
      }
    };

    webClient.on('test', handler);
    webClient.on('error', handler);
  });
});
