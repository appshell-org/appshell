import { enableFetchMocks } from 'jest-fetch-mock';
import { mockDeep } from 'jest-mock-extended';
import makeServiceWorkerEnv from 'service-worker-mock';

enableFetchMocks();

const mockSelf = {
  apiKey: '',
  addEventListener: jest.fn(),
  skipWaiting: jest.fn(),
};

describe('service-worker', () => {
  let handleActivateEvent: () => void;
  let handleFetchEvent: (event: FetchEvent) => void;
  let handleMessageEvent: (event: Partial<ExtendableMessageEvent>) => void;
  let handleInstallEvent: () => void;
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv(), { self: mockSelf });
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const worker = require('../src/worker/service-worker');
    handleActivateEvent = worker.handleActivateEvent;
    handleFetchEvent = worker.handleFetchEvent;
    handleMessageEvent = worker.handleMessageEvent;
    handleInstallEvent = worker.handleInstallEvent;

    jest.resetModules();
  });

  it('should skip waiting on install event', () => {
    handleInstallEvent();

    expect(mockSelf.skipWaiting).toHaveBeenCalled();
  });

  it('should log a message on activate event', () => {
    const consoleDebugSpy = jest.spyOn(console, 'debug');

    handleActivateEvent();

    expect(consoleDebugSpy).toHaveBeenCalledWith('Service Worker activating.');
  });

  it('should set apiKey on message event', () => {
    const apiKey = 'test-api-key';

    handleMessageEvent({ data: { type: 'apiKey', apiKey } });

    expect(mockSelf.apiKey).toBe(apiKey);
  });

  it('should add X-API-KEY header to fetch requests', async () => {
    const apiKey = 'test-api-key';
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementationOnce(() => Promise.resolve(mockDeep<Response>()));

    const ev = mockDeep<FetchEvent>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      request: 'https://example.com' as any,
      respondWith: jest.fn(),
    });

    await handleFetchEvent(ev);

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: { 'X-API-KEY': apiKey },
        credentials: 'same-origin',
        mode: 'cors',
      }),
    );
  });
});
