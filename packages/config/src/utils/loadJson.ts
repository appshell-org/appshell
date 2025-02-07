import { HttpStatusCode } from 'axios';
import fs from 'fs';
import https from 'https';
import axios from '../axios';
import isValidUrl from './isValidUrl';
import list from './list';

type LoadJsonOptions = {
  insecure: boolean;
  target: string | RegExp;
  apiKey?: string;
  proxyUrl?: string;
};

const loadJson = async <T = Record<string, unknown>>(
  jsonPathOrUrl: string,
  insecure: boolean,
  target: string | RegExp,
  apiKey?: string,
  proxyUrl?: string,
): Promise<T[]> => {
  if (isValidUrl(jsonPathOrUrl)) {
    const url = proxyUrl ? `${proxyUrl}?target=${encodeURI(jsonPathOrUrl)}` : jsonPathOrUrl;
    console.log(`loading json from host ${url}`);
    const headers = apiKey ? { apikey: apiKey } : {};
    const resp = await axios.get<T>(
      url,
      insecure
        ? {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers,
          }
        : { headers },
    );
    if (resp.status === HttpStatusCode.Ok) {
      return [resp.data];
    }
    throw new Error(`Failed to load file from ${url}`);
  }

  if (fs.existsSync(jsonPathOrUrl)) {
    const stat = fs.statSync(jsonPathOrUrl);
    if (stat.isDirectory()) {
      console.debug(`loading json from dir ${jsonPathOrUrl}`);
      const files = list(jsonPathOrUrl, 1, target);
      const entries = files.map((file) => loadJson(file, insecure, target, apiKey, proxyUrl));

      const docs = await Promise.all(entries).then((items) => items.flat() as T[]);

      console.debug(`loaded ${docs.length} documents`);
      return docs;
    }

    console.debug(`loading json from file ${jsonPathOrUrl}`);
    const json = JSON.parse(fs.readFileSync(jsonPathOrUrl, 'utf-8')) as T;

    return [json];
  }

  console.warn(`registry at ${jsonPathOrUrl} does not exist yet... nothing to load.`);
  return [];
};

export default async <T = Record<string, unknown>>(
  jsonPathOrUrl: string,
  options: LoadJsonOptions = {
    insecure: false,
    target: /\.json$/i,
    apiKey: undefined,
    proxyUrl: undefined,
  },
): Promise<T[]> => {
  const items = await loadJson<T[]>(
    jsonPathOrUrl,
    options.insecure,
    options.target,
    options.apiKey,
    options.proxyUrl,
  );

  return items.flat();
};
