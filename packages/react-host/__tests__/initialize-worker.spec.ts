/* eslint-disable global-require, @typescript-eslint/no-var-requires */

/**
 * @jest-environment jsdom
 */

import { enableFetchMocks } from 'jest-fetch-mock';
import { mockDeep } from 'jest-mock-extended';
import makeServiceWorkerEnv from 'service-worker-mock';

enableFetchMocks();

const mockSelf = {
  apiKey: '',
  addEventListener: jest.fn(),
  skipWaiting: jest.fn(),
};

jest.mock('@appshell/core', () => ({
  APPSHELL_ENV: {
    APPSHELL_SERVICE_WORKER_URL: 'worker.js',
  },
}));

describe('initialize-worker', () => {
  beforeAll(() => {
    Object.assign(global, makeServiceWorkerEnv(), {
      self: mockSelf,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockDeep<ServiceWorkerContainer>(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  describe('unregisterAppshellServiceWorker', () => {
    it('should log a message if no Appshell Service Worker is found', async () => {
      const { unregisterAppshellServiceWorker } = require('../src/worker/initialize');
      const consoleLogSpy = jest.spyOn(console, 'debug');
      jest.spyOn(navigator.serviceWorker, 'getRegistrations').mockResolvedValue([]);

      await unregisterAppshellServiceWorker('worker.js');

      expect(consoleLogSpy).toHaveBeenCalledWith('No Appshell Service Worker found');
    });

    it('should unregister the worker and log a success message', async () => {
      const { unregisterAppshellServiceWorker } = require('../src/worker/initialize');
      const mockRegistration = {
        active: {
          scriptURL: 'https://example.com/worker.js',
        },
        unregister: jest.fn().mockResolvedValue(true),
      };
      navigator.serviceWorker.getRegistrations = jest.fn().mockResolvedValue([mockRegistration]);
      const consoleLogSpy = jest.spyOn(console, 'debug');

      await unregisterAppshellServiceWorker('worker.js');

      expect(consoleLogSpy).toHaveBeenCalledWith('Unregistering worker worker.js');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Appshell Service Worker successfullly unregistered',
      );
    });

    it('should unregister the worker and log a failure message', async () => {
      const { unregisterAppshellServiceWorker } = require('../src/worker/initialize');
      const mockRegistration = {
        active: {
          scriptURL: 'https://example.com/worker.js',
        },
        unregister: jest.fn().mockResolvedValue(false),
      };
      navigator.serviceWorker.getRegistrations = jest.fn().mockResolvedValue([mockRegistration]);
      const consoleLogSpy = jest.spyOn(console, 'debug');

      await unregisterAppshellServiceWorker('worker.js');

      expect(consoleLogSpy).toHaveBeenCalledWith('Unregistering worker worker.js');
      expect(consoleLogSpy).toHaveBeenCalledWith('Appshell Service Worker failed to unregister');
    });
  });

  describe('fetchServiceWorkerConfig', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should fetch the API key successfully', async () => {
      const { fetchServiceWorkerConfig } = require('../src/worker/initialize');
      const mockResponse = mockDeep<Response>({
        ok: true,
        json: jest.fn().mockResolvedValue({
          apiKey: 'test-api-key',
          proxyUrl: 'http://my-proxy-domain/proxy',
        }),
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      const config = await fetchServiceWorkerConfig();

      expect(global.fetch).toHaveBeenCalledWith('/service-worker-config');
      expect(config).toMatchObject({
        apiKey: 'test-api-key',
        proxyUrl: 'http://my-proxy-domain/proxy',
      });
    });

    it('should throw an error if fetching the API key fails', async () => {
      const { fetchServiceWorkerConfig } = require('../src/worker/initialize');
      const mockResponse = mockDeep<Response>({
        ok: false,
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

      await expect(fetchServiceWorkerConfig()).rejects.toThrow(
        'Failed to fetch service worker config',
      );
    });
  });

  describe('initializeAppshellServiceWorker', () => {
    beforeEach(() => {
      jest.mock('@appshell/core', () => ({
        APPSHELL_ENV: {
          APPSHELL_SERVICE_WORKER_URL: 'worker.js',
        },
      }));
      jest.resetModules();
    });

    it('should log a message if Appshell Service Worker URL is not configured', async () => {
      const initModule = require('../src/worker/initialize');
      const { initializeAppshellServiceWorker } = initModule;
      const consoleLogSpy = jest.spyOn(console, 'debug');
      const unregisterAppshellServiceWorkerSpy = jest.spyOn(
        initModule,
        'unregisterAppshellServiceWorker',
      );

      jest.mock('@appshell/core', () => ({
        APPSHELL_ENV: {
          APPSHELL_SERVICE_WORKER_URL: undefined,
        },
      }));

      await initializeAppshellServiceWorker();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Appshell Service Worker URL not configured. To enable, configure APPSHELL_SERVICE_WORKER_URL in your environment.',
      );
      expect(unregisterAppshellServiceWorkerSpy).not.toHaveBeenCalled();
    });

    it('should log a message if Appshell API key is not configured and unregister the worker', async () => {
      const initModule = require('../src/worker/initialize');
      const { initializeAppshellServiceWorker } = initModule;
      const consoleLogSpy = jest.spyOn(console, 'debug');
      const unregisterAppshellServiceWorkerSpy = jest
        .spyOn(initModule, 'unregisterAppshellServiceWorker')
        .mockResolvedValue(undefined);
      const fetchServiceWorkerConfigSpy = jest
        .spyOn(initModule, 'fetchServiceWorkerConfig')
        .mockResolvedValue(undefined);

      await initializeAppshellServiceWorker();

      expect(consoleLogSpy).toHaveBeenCalledWith('Appshell Service Worker not configured.');
      expect(unregisterAppshellServiceWorkerSpy).toHaveBeenCalledWith('worker.js');
      expect(fetchServiceWorkerConfigSpy).toHaveBeenCalled();
    });

    it('should register the Appshell Service Worker and send the API key', async () => {
      const initModule = require('../src/worker/initialize');
      const { initializeAppshellServiceWorker } = initModule;
      const consoleLogSpy = jest.spyOn(console, 'debug');
      const fetchServiceWorkerConfigSpy = jest
        .spyOn(initModule, 'fetchServiceWorkerConfig')
        .mockResolvedValue({
          apiKey: 'test-api-key',
          proxyUrl: 'http://my-proxy-domain/proxy',
        });
      const registerSpy = jest.spyOn(navigator.serviceWorker, 'register');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const postMessageSpy = jest.spyOn(navigator.serviceWorker.controller!, 'postMessage');

      await initializeAppshellServiceWorker();

      expect(fetchServiceWorkerConfigSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Registering Appshell Service Worker worker.js');
      expect(registerSpy).toHaveBeenCalledWith('worker.js');
      expect(consoleLogSpy).toHaveBeenCalledWith('Appshell Service Worker Registered');
      expect(postMessageSpy).toHaveBeenCalledWith({
        type: 'config',
        config: {
          apiKey: 'test-api-key',
          proxyUrl: 'http://my-proxy-domain/proxy',
        },
      });
    });

    it('should log an error if an exception is thrown', async () => {
      const initModule = require('../src/worker/initialize');
      const { initializeAppshellServiceWorker } = initModule;
      const consoleErrorSpy = jest.spyOn(console, 'error');
      jest.spyOn(initModule, 'fetchServiceWorkerConfig').mockRejectedValue(new Error('Test error'));

      await initializeAppshellServiceWorker();

      expect(consoleErrorSpy).toHaveBeenCalledWith(new Error('Test error'));
    });
  });
});
