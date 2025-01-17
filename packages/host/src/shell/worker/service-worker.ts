/* eslint-disable no-console */
import { headersToObject, isExternalDomain } from './util';

export type {};
declare const self: ServiceWorkerGlobalScope & { apiKey: string };

export const handleInstallEvent = (event: ExtendableEvent) => {
  console.debug('Service Worker installing.');
  event.waitUntil(self.skipWaiting());
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
  const requestUrl = event.request.url;

  // eslint-disable-next-line no-restricted-globals
  if (!isExternalDomain(requestUrl, location.origin)) {
    event.respondWith(
      fetch(
        new Request(event.request, {
          mode: 'cors',
          credentials: 'same-origin',
          headers: new Headers({
            ...headersToObject(event.request.headers),
            apikey: self.apiKey,
          }),
        }),
      )
        .then((response) => response)
        .catch((error) => {
          console.warn('Failed to fetch resource:', requestUrl);
          console.error(error);
          return new Response('An error occurred', { status: 500 });
        }) as Promise<Response>,
    );
  }
};

self.addEventListener('install', handleInstallEvent);
self.addEventListener('activate', handleActivateEvent);
self.addEventListener('message', handleMessageEvent);
self.addEventListener('fetch', handleFetchEvent);
