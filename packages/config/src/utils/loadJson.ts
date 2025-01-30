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
};

const loadJson = async <T = Record<string, unknown>>(
  jsonPathOrUrl: string,
  insecure: boolean,
  target: string | RegExp,
  apiKey?: string,
): Promise<T[]> => {
  if (isValidUrl(jsonPathOrUrl)) {
    const headers = apiKey ? { apikey: apiKey } : {};
    const resp = await axios.get<T>(
      jsonPathOrUrl,
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
    throw new Error(`Failed to load file from ${jsonPathOrUrl}`);
  }

  const stat = fs.statSync(jsonPathOrUrl);
  if (stat.isDirectory()) {
    const files = list(jsonPathOrUrl, 1, target);
    const entries = files.map((file) => loadJson(file, insecure, target, apiKey));

    const docs = await Promise.all(entries).then((items) => items.flat() as T[]);

    return docs;
  }

  const json = JSON.parse(fs.readFileSync(jsonPathOrUrl, 'utf-8')) as T;

  return [json];
};

export default async <T = Record<string, unknown>>(
  jsonPathOrUrl: string,
  options: LoadJsonOptions = {
    insecure: false,
    target: /\.json$/i,
    apiKey: undefined,
  },
): Promise<T[]> => {
  const items = await loadJson<T[]>(
    jsonPathOrUrl,
    options.insecure,
    options.target,
    options.apiKey,
  );

  return items.flat();
};
