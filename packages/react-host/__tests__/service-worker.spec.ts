import { enableFetchMocks } from 'jest-fetch-mock';
import { mockDeep } from 'jest-mock-extended';
import makeServiceWorkerEnv from 'service-worker-mock';

enableFetchMocks();

const mockSelf = {
  apiKey: '',
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

  it('should set apiKey on message event', () => {
    const apiKey = 'test-api-key';

    worker.handleMessageEvent({ data: { type: 'apiKey', apiKey } });

    expect(mockSelf.apiKey).toBe(apiKey);
  });

  it('should add X-API-KEY header to fetch requests', async () => {
    jest
      .spyOn(global, 'Request')
      .mockImplementation((input: RequestInfo | URL | string, init?: RequestInit) => {
        if (typeof input === 'string') {
          return {
            ...init,
            url: input,
            headers: new Headers(init?.headers || {}),
          } as Request;
        }

        return {
          ...input,
          ...init,
          headers: new Headers(init?.headers || {}),
        } as Request;
      });

    const apiKey = 'test-api-key';
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() => Promise.resolve(mockDeep<Response>()));

    const ev = mockDeep<FetchEvent>({
      request: new Request('https://example.com'),
      respondWith: jest.fn(),
    });

    await worker.handleFetchEvent(ev);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
        headers: new Headers({ 'X-API-KEY': apiKey }),
        credentials: 'same-origin',
        mode: 'cors',
      }),
    );
  });
});
