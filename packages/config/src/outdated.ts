/* eslint-disable no-console */
import chalk from 'chalk';
import { PackageSpec, SharedModuleSpec } from './types';
import { compareSharedDependencies, printResults } from './utils/compare';

export default async (packageSpec: PackageSpec, sharedModuleSpec: SharedModuleSpec) => {
  console.log(
    chalk.blue(
      `Analyzing project ${packageSpec.name} for outdated shared dependencies defined by ${sharedModuleSpec.name}`,
    ),
  );
  console.debug(JSON.stringify({ packageSpec }, null, 2));
  console.debug(JSON.stringify({ sharedModuleSpec }, null, 2));

  const results = compareSharedDependencies(packageSpec, sharedModuleSpec);
  printResults(results);

  return results;
};
