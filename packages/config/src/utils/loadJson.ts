import { HttpStatusCode } from 'axios';
import fs from 'fs';
import https from 'https';
import { inspect } from 'util';
import axios from '../axios';
import isValidUrl from './isValidUrl';
import list from './list';

type LoadJsonOptions = {
  insecure: boolean;
  target: string | RegExp;
  apiKey: string | undefined;
};

const loadJson = async <T = Record<string, unknown>>(
  jsonPathOrUrl: string,
  insecure: boolean,
  target: string | RegExp,
  apiKey?: string,
): Promise<T[]> => {
  if (isValidUrl(jsonPathOrUrl)) {
    try {
      console.log(`Fetching from ${jsonPathOrUrl}`, { insecure, target, apiKey: !!apiKey });
      const headers = apiKey
        ? {
            apiKey,
            'Content-Type': 'application/json',
          }
        : {};
      const resp = await axios.get<T>(jsonPathOrUrl, {
        headers,
        httpsAgent: new https.Agent({ rejectUnauthorized: !insecure }),
      });
      if (resp.status === HttpStatusCode.Ok) {
        return [resp.data];
      }
    } catch (err: any) {
      console.log(inspect(err));
      throw new Error(`Failed to load file from ${jsonPathOrUrl}: ${err.message}`);
    }
  }

  const stat = fs.statSync(jsonPathOrUrl);
  if (stat.isDirectory()) {
    const files = list(jsonPathOrUrl, 1, target);
    const entries = files.map((file) => loadJson(file, insecure, target));

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
