/* eslint-disable no-console */
import { outdated, sync } from '@appshell/config';
import { PackageManager, ResolutionStrategy } from 'packages/config/src/sync';
import { ComparisonResult, SharedObject } from 'packages/config/src/types';
import { fetchPackageSpec, fetchSnapshot } from '../util/fetch';

export type SyncArgs = {
  workingDir: string;
  registry: string;
  packageManager: string;
  resolutionStrategy: string;
  dryRun: boolean;
};

export default async (argv: SyncArgs) => {
  const { workingDir, registry, packageManager, resolutionStrategy, dryRun } = argv;

  try {
    console.log(
      `sync --working-dir=${workingDir} --registry=${registry} --package-manager=${packageManager} --resolution-strategy=${resolutionStrategy} --dry-run=${dryRun}`,
    );

    const packageSpec = await fetchPackageSpec(workingDir);
    const snapshot = await fetchSnapshot(registry);

    console.debug('Snapshot:', JSON.stringify(snapshot, null, 2));
    const jobs = Object.entries(snapshot.modules).map(([name, options]) =>
      outdated(packageSpec, {
        name,
        shared: options.shared as SharedObject,
      }),
    );

    const results = await Promise.all(jobs);
    console.debug('Results:', JSON.stringify(results, null, 2));

    const outOfSync = results.reduce(
      (acc, result) =>
        Object.values(result.conflicts).reduce((prev, conflict) => {
          prev[`${conflict.packageName}@${conflict.baselineVersion}`] = conflict;

          return prev;
        }, acc),
      {} as Record<string, ComparisonResult>,
    );

    await sync(
      workingDir,
      registry,
      outOfSync,
      resolutionStrategy as ResolutionStrategy,
      packageManager as PackageManager,
      dryRun,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error analyzing outdated shared dependencies', err.message);
  }
};
