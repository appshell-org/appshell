/* eslint-disable no-console */
import { APPSHELL_ENV } from '@appshell/core';

export const unregisterAppshellServiceWorker = async (workerUrl: string) => {
  const registrations = await navigator.serviceWorker.getRegistrations();

  const worker = registrations.find((registration) =>
    registration.active?.scriptURL.includes(workerUrl),
  );

  if (!worker) {
    console.debug('No Appshell Service Worker found');
    return;
  }

  console.debug(`Unregistering worker ${workerUrl}`);
  const isUnregistered = await worker.unregister();
  console.debug(
    `Appshell Service Worker ${
      isUnregistered ? 'successfullly unregistered' : 'failed to unregister'
    }`,
  );
};

export const fetchServiceWorkerConfig = async () => {
  const response = await fetch('/service-worker-config');
  if (response.ok) {
    const { apiKey, apiKeyHeader, proxyUrl } = await response.json();

    console.log(
      `Appshell Service Worker initialized with configuration apiKey: ${apiKey}, apiKeyHeader: ${apiKeyHeader}, proxyUrl: ${proxyUrl}`,
    );

    let url: URL;
    if (proxyUrl) {
      try {
        url = new URL(proxyUrl);
      } catch (error) {
        console.error(`Invalid proxy URL: ${proxyUrl}`, error);
        throw new Error('Invalid proxy URL');
      }

      // Replace host.docker.internal with localhost to enable call to be made from the browser
      if (/^host.docker.internal/.test(url.hostname)) {
        console.debug(
          `Appshell Service Worker replacing configured hostname ${url.hostname} with localhost`,
        );
        url.hostname = 'localhost';
      }

      return { apiKey, apiKeyHeader, proxyUrl: url.toString() };
    }

    // Default to the current hostname
    const defaultHostname = `${window.location.protocol}//${window.location.host}`;
    url = new URL(defaultHostname);
    console.debug(`Proxy URL not set. Defaulting to current hostname: ${defaultHostname}`);

    return { apiKey, apiKeyHeader, proxyUrl };
  }

  throw new Error('Failed to fetch service worker config');
};

export const initializeAppshellServiceWorker = async () => {
  const workerUrl = APPSHELL_ENV.APPSHELL_SERVICE_WORKER_URL;

  if (!workerUrl) {
    console.debug(
      'Appshell Service Worker URL not configured. To enable, configure APPSHELL_SERVICE_WORKER_URL in your environment.',
    );
    return;
  }

  try {
    const config = await fetchServiceWorkerConfig();

    if (!config) {
      console.debug('Appshell Service Worker not configured.');

      await unregisterAppshellServiceWorker(workerUrl);
      return;
    }

    console.debug(`Registering Appshell Service Worker ${workerUrl}`);
    await navigator.serviceWorker.register(workerUrl);

    console.debug('Appshell Service Worker Registered');
    navigator.serviceWorker.controller?.postMessage({
      type: 'config',
      config,
    });
  } catch (error) {
    console.error(error);
  }
};
