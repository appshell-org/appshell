import { APPSHELL_ENV } from '@appshell/core';

export const unregisterAppshellServiceWorker = async (workerUrl: string) => {
  const registrations = await navigator.serviceWorker.getRegistrations();

  const worker = registrations.find((registration) =>
    registration.active?.scriptURL.includes(workerUrl),
  );

  if (!worker) {
    console.log('No Appshell Service Worker found');
    return;
  }

  console.log(`Unregistering worker ${workerUrl}`);
  const isUnregistered = await worker.unregister();
  console.log(
    `Appshell Service Worker ${
      isUnregistered ? 'successfullly unregistered' : 'failed to unregister'
    }`,
  );
};

export const fetchApiKey = async () => {
  const response = await fetch('/api-key');
  if (response.ok) {
    const { apiKey } = await response.json();

    return apiKey;
  }

  throw new Error('Failed to fetch API key');
};

export const initializeAppshellServiceWorker = async () => {
  const workerUrl = APPSHELL_ENV.APPSHELL_SERVICE_WORKER_URL;

  if (!workerUrl) {
    console.log(
      'Appshell Service Worker URL not configured. To enable, configure APPSHELL_SERVICE_WORKER_URL in your environment.',
    );
    return;
  }

  try {
    const apiKey = await fetchApiKey();

    if (!apiKey) {
      console.log('Appshell API key not configured.');

      await unregisterAppshellServiceWorker(workerUrl);
      return;
    }

    console.log(`Registering Appshell Service Worker ${workerUrl}`);
    await navigator.serviceWorker.register(workerUrl);

    console.log('Appshell Service Worker Registered');
    navigator.serviceWorker.controller?.postMessage({
      type: 'apiKey',
      apiKey,
    });
  } catch (error) {
    console.error(error);
  }
};
