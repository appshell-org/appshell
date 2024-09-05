export type {};
declare const self: ServiceWorkerGlobalScope & { apiKey: string };

export const handleInstallEvent = () => {
  console.debug('Service Worker installing.');
  self.skipWaiting();
};

export const handleActivateEvent = () => {
  console.debug('Service Worker activating.');
};

export const handleMessageEvent = (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'apiKey') {
    const { apiKey } = event.data;
    const chars = 5;
    console.debug(
      'Service Worker received new auth token:',
      `${apiKey.slice(0, chars)}...${apiKey.slice(-chars)}`,
    );

    self.apiKey = apiKey;
  }
};

export const handleFetchEvent = (event: FetchEvent) => {
  event.respondWith(
    fetch(event.request, {
      headers: { 'X-API-KEY': self.apiKey },
      mode: 'cors',
      credentials: 'same-origin',
    }) as Promise<Response>,
  );
};

self.addEventListener('install', handleInstallEvent);
self.addEventListener('activate', handleActivateEvent);
self.addEventListener('message', handleMessageEvent);
self.addEventListener('fetch', handleFetchEvent);
