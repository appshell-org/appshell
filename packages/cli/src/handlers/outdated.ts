/* eslint-disable no-console */
import { AppshellManifest, outdated, PackageSpec, utils } from '@appshell/config';
import { HttpStatusCode } from 'axios';
import fs from 'fs';
import https from 'https';
import { SharedObject } from 'packages/config/src/types';
import axios from '../axios';

export type OutdatedArgs = {
  workingDir: string;
  registry: string;
  manager: string;
  verbose?: boolean;
};

export const fetchSnapshot = async (registryPathOrUrl: string) => {
  console.debug(`Fetching snapshot from ${registryPathOrUrl}`);
  const agent = new https.Agent({ rejectUnauthorized: false });
  const res = await axios.get(registryPathOrUrl, {
    httpsAgent: agent,
    headers: {
      'X-Api-Key': process.env.APPSHELL_API_KEY,
    },
  });
  console.debug('Response:', JSON.stringify(res, null, 2));
  if (res.status === HttpStatusCode.Ok) {
    return res.data as AppshellManifest;
  }

  throw new Error(`Failed to fetch registry ${registryPathOrUrl}. ${res.statusText}`);
};

export default async (argv: OutdatedArgs) => {
  const { workingDir, registry, manager, verbose } = argv;

  try {
    console.log(
      `outdated --working-dir=${workingDir} --registry=${registry} --manager=${manager} --verbose=${verbose}`,
    );

    const packageSpecPath = `${workingDir}/package.json`;
    const registryPathOrUrl = `${registry}/appshell.snapshot.json`;

    if (!fs.existsSync(packageSpecPath)) {
      throw new Error(`package.json not found. ${packageSpecPath}`);
    }

    const packageSpec = JSON.parse(fs.readFileSync(packageSpecPath, 'utf-8')) as PackageSpec;

    let snapshot: AppshellManifest;
    if (utils.isValidUrl(registryPathOrUrl)) {
      snapshot = await fetchSnapshot(registryPathOrUrl);
    } else if (fs.existsSync(registryPathOrUrl)) {
      console.debug(`Reading snapshot from ${registryPathOrUrl}`);
      snapshot = JSON.parse(fs.readFileSync(registryPathOrUrl, 'utf-8')) as AppshellManifest;
    } else {
      throw new Error(`Registry not found. ${registryPathOrUrl}`);
    }

    console.debug('Snapshot:', JSON.stringify(snapshot, null, 2));
    const jobs = Object.entries(snapshot.modules).map(([name, options]) =>
      outdated(packageSpec, {
        name: options.name || name,
        shared: options.shared as SharedObject,
      }),
    );

    await Promise.all(jobs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error analyzing outdated shared dependencies', err.message);
  }
};
