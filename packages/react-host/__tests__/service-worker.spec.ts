/* eslint-disable @typescript-eslint/no-unused-vars */

import { enableFetchMocks } from 'jest-fetch-mock';
import { mockDeep } from 'jest-mock-extended';
import makeServiceWorkerEnv from 'service-worker-mock';

enableFetchMocks();

const mockSelf = {
  apiKey: '',
  apiKeyHeader: '',
  proxyUrl: '',
  addEventListener: jest.fn(),
  skipWaiting: jest.fn(),
};

jest.mock('../src/worker/util', () => {
  const originalModule = jest.requireActual('../src/worker/util');
  return {
    ...originalModule,
    headersToObject: jest.fn().mockImplementation(() => ({})),
  };
});

describe('service-worker', () => {
  let worker: typeof import('../src/worker/service-worker');
  let originalLocation: Location;
  const workerLocation: Location = mockDeep<Location>({ origin: 'https://example.com' });
  const apiKey = 'test-api-key';
  const apiKeyHeader = 'test-api-key-header';
  const proxyUrl = 'http://my-proxy-domain/proxy';
  const mockMessageEvent: ExtendableMessageEvent = {
    data: {
      type: 'config',
      config: {
        apiKey,
        apiKeyHeader,
        proxyUrl,
      },
    },
    lastEventId: '',
    origin: '',
    ports: [],
    source: null,
    waitUntil: (): void => {
      throw new Error('Function not implemented.');
    },
    bubbles: false,
    cancelBubble: false,
    cancelable: false,
    composed: false,
    currentTarget: null,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    returnValue: false,
    srcElement: null,
    target: null,
    timeStamp: 0,
    type: '',
    composedPath: (): EventTarget[] => {
      throw new Error('Function not implemented.');
    },
    initEvent: (
      type: string,
      bubbles?: boolean | undefined,
      cancelable?: boolean | undefined,
    ): void => {
      throw new Error('Function not implemented.');
    },
    preventDefault: (): void => {
      throw new Error('Function not implemented.');
    },
    stopImmediatePropagation: (): void => {
      throw new Error('Function not implemented.');
    },
    stopPropagation: (): void => {
      throw new Error('Function not implemented.');
    },
    NONE: 0,
    CAPTURING_PHASE: 1,
    AT_TARGET: 2,
    BUBBLING_PHASE: 3,
  };

  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv(), { self: mockSelf });
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    worker = require('../src/worker/service-worker');

    originalLocation = global.location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).location;
    global.location = workerLocation;

    jest.resetModules();
  });

  afterEach(() => {
    global.location = originalLocation;
  });

  it('should skip waiting on install event', () => {
    const ev = mockDeep<InstallEvent>();

    worker.handleInstallEvent(ev);

    expect(mockSelf.skipWaiting).toHaveBeenCalled();
  });

  it('should log a message on activate event', () => {
    const consoleDebugSpy = jest.spyOn(console, 'debug');

    worker.handleActivateEvent();

    expect(consoleDebugSpy).toHaveBeenCalledWith('Service Worker activating.');
  });

  it('should set api config on message event', () => {
    worker.handleMessageEvent(mockMessageEvent);

    expect(mockSelf.apiKey).toBe(apiKey);
    expect(mockSelf.apiKeyHeader).toBe(apiKeyHeader);
    expect(mockSelf.proxyUrl).toBe(proxyUrl);
  });

  it('should add apikey header to fetch requests', async () => {
    jest
      .spyOn(global, 'Request')
      .mockImplementation((input: RequestInfo | URL | string, init?: RequestInit): any => {
        const clone = jest.fn(() => ({
          text: jest.fn(),
        }));
        if (typeof input === 'string') {
          return {
            ...init,
            url: input,
            headers: new Headers(init?.headers || {}),
            clone,
          };
        }

        return {
          ...input,
          ...init,
          headers: new Headers(init?.headers || {}),
          clone,
        };
      });

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() => Promise.resolve(mockDeep<Response>()));

    const ev = mockDeep<FetchEvent>({
      request: new Request('https://example.com'),
      respondWith: jest.fn(),
    });

    worker.handleMessageEvent(mockMessageEvent);
    await worker.proxyCall(
      new Request('https://example.com', {
        credentials: 'same-origin',
        mode: 'cors',
        headers: {},
      }),
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: `${proxyUrl}?target=https://example.com`,
        headers: new Headers({ [apiKeyHeader]: apiKey }),
        credentials: 'same-origin',
        mode: 'cors',
        body: undefined,
        cache: undefined,
        clone: expect.anything(),
        redirect: undefined,
        referrer: undefined,
        referrerPolicy: undefined,
      }),
    );
  });
});
