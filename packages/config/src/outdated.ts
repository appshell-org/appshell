/* eslint-disable no-console */
import chalk from 'chalk';
import { PackageSpec, SharedModuleSpec } from './types';
import { compareSharedDependencies } from './utils/compare';

export default async (packageSpec: PackageSpec, sharedModuleSpec: SharedModuleSpec) => {
  console.debug(
    chalk.blue(
      `Analyzing project ${packageSpec.name} for outdated shared dependencies defined by ${sharedModuleSpec.name}`,
    ),
  );
  console.debug(`Package spec: ${JSON.stringify(packageSpec, null, 2)}`);
  console.debug(`Shared module spec: ${JSON.stringify(sharedModuleSpec, null, 2)}`);

  const results = compareSharedDependencies(packageSpec, sharedModuleSpec);

  return results;
};
