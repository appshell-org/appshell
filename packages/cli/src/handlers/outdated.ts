/* eslint-disable no-console */
import { outdated, utils } from '@appshell/config';
import { SharedObject } from 'packages/config/src/types';
import { fetchPackageSpec, fetchSnapshot } from '../util/fetch';

export type OutdatedArgs = {
  apiKey: string | undefined;
  registry: string;
  workingDir: string;
  manager: string;
};

export default async (argv: OutdatedArgs) => {
  const { apiKey, workingDir, registry, manager } = argv;

  try {
    console.log(`outdated --working-dir=${workingDir} --registry=${registry} --manager=${manager}`);

    const packageSpec = await fetchPackageSpec(workingDir, apiKey);
    const snapshot = await fetchSnapshot(registry, apiKey);

    console.debug('Snapshot:', JSON.stringify(snapshot, null, 2));
    const jobs = Object.entries(snapshot.modules).map(async ([name, options]) => {
      const results = await outdated(packageSpec, {
        name,
        shared: options.shared as SharedObject,
      });
      utils.printResults(results);

      return results;
    });

    await Promise.all(jobs);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error analyzing outdated shared dependencies', err.message);
  }
};
