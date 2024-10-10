/* eslint-disable no-console */
import { AppshellManifest, PackageSpec, utils } from '@appshell/config';
import { HttpStatusCode } from 'axios';
import fs from 'fs';
import https from 'https';
import axios from './axios';

export const fetchFromRegistry = async <T>(registryPathOrUrl: string) => {
  console.debug(`Fetching snapshot from ${registryPathOrUrl}`);
  const agent = new https.Agent({ rejectUnauthorized: false });
  const res = await axios.get(registryPathOrUrl, {
    httpsAgent: agent,
    headers: {
      'X-Api-Key': process.env.APPSHELL_API_KEY,
    },
  });

  console.debug(`/GET ${res.status} ${res.statusText}`);

  if (res.status === HttpStatusCode.Ok) {
    return res.data as T;
  }

  throw new Error(
    `Failed to fetch from registry ${registryPathOrUrl}. ${res.status} ${res.statusText}`,
  );
};

export const fetchSnapshot = async (registry: string) => {
  const registryPathOrUrl = `${registry}/appshell.snapshot.json`;

  if (utils.isValidUrl(registryPathOrUrl)) {
    return fetchFromRegistry<AppshellManifest>(registryPathOrUrl);
  }

  if (fs.existsSync(registryPathOrUrl)) {
    console.debug(`Reading snapshot from ${registryPathOrUrl}`);
    return JSON.parse(fs.readFileSync(registryPathOrUrl, 'utf-8')) as AppshellManifest;
  }

  throw new Error(`Registry not found. ${registryPathOrUrl}`);
};

export const fetchPackageSpec = async (workingDir: string) => {
  const packageSpecPath = `${workingDir}/package.json`;

  if (!fs.existsSync(packageSpecPath)) {
    throw new Error(`Package spec not found at ${packageSpecPath}`);
  }

  return JSON.parse(fs.readFileSync(packageSpecPath, 'utf-8')) as PackageSpec;
};
