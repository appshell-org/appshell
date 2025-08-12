/// <reference lib="webworker" />

/* eslint-disable no-console */
import { isExternalDomain } from './util';

export type {};
declare const self: ServiceWorkerGlobalScope & {
  apiKey: string;
  apiKeyHeader: string;
  proxyUrl: string;
};

const bodyForbidden = (method: string) => /^(get|GET|head|HEAD)$/.test(method);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleInstallEvent = (event: any /** InstallEvent */) => {
  console.debug('Service Worker installing.');
  event.waitUntil(self.skipWaiting());
};

export const handleActivateEvent = () => {
  console.debug('Service Worker activating.');
};

export const handleMessageEvent = (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'config') {
    const { apiKey, apiKeyHeader, proxyUrl } = event.data.config;
    const chars = 5;
    console.debug(
      'Service Worker received API key:',
      apiKey ? `${apiKey.slice(0, chars)}...${apiKey.slice(-chars)}` : undefined,
    );
    console.debug(`Service Worker using API key header: ${apiKeyHeader}`);
    console.debug(`Service Worker received proxy url`, proxyUrl);

    self.apiKey = apiKey;
    self.apiKeyHeader = apiKeyHeader;
    self.proxyUrl = proxyUrl;
  }
};

export const proxyCall = async (request: Request) => {
  const requestUrl = request.url;
  const body = await request.clone().text(); // Clone and read the body
  const headers = new Headers({ ...Object.fromEntries(request.headers.entries()) });
  if (self.apiKey) {
    headers.append(self.apiKeyHeader, self.apiKey);
  }
  const requestInit = {
    method: request.method,
    headers,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity,
  };
  const newRequest = new Request(
    self.proxyUrl ? `${self.proxyUrl}?target=${requestUrl}` : requestUrl,
    bodyForbidden(request.method)
      ? requestInit
      : {
          ...requestInit,
          body,
        },
  );

  try {
    return await fetch(newRequest);
  } catch (error) {
    console.warn('Failed to fetch resource:', requestUrl);
    console.error(error);
    return new Response('An error occurred', { status: 500 });
  }
};

export const handleFetchEvent = (event: FetchEvent) => {
  const requestUrl = event.request.url;

  // eslint-disable-next-line no-restricted-globals
  if (isExternalDomain(requestUrl, location.origin)) {
    console.debug(`Proxying ${requestUrl} to ${self.proxyUrl}`);
    event.respondWith(proxyCall(event.request));
  }
};

self.addEventListener('install', handleInstallEvent);
self.addEventListener('activate', handleActivateEvent);
self.addEventListener('message', handleMessageEvent);
self.addEventListener('fetch', handleFetchEvent);
