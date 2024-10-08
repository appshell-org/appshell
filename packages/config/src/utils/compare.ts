/* eslint-disable no-console */
import chalk from 'chalk';
import { isString, set } from 'lodash';
import semver from 'semver';
import {
  ComparisonResult,
  ComparisonResults,
  ComparisonTarget,
  PackageSpec,
  SharedModuleSpec,
} from '../types';

export const extractDependencies = (sharedModule: SharedModuleSpec) =>
  Object.entries(sharedModule.shared).reduce((acc, [key, value]) => {
    const version = isString(value) ? value : value.requiredVersion || value.version;
    return set(acc, key, version);
  }, {} as Record<string, string>);

export const compareDependency = (
  packageName: string,
  sampleModule: string,
  sampleVersion: string,
  baselineModule: string,
  baselineVersion: string,
  results: ComparisonResults,
) => {
  console.debug(
    `Comparing dependency ${packageName}@${sampleVersion} in ${sampleModule} against ${baselineVersion} in ${baselineModule}`,
  );

  if (!baselineVersion) {
    return results;
  }

  if (!sampleVersion) {
    set(results.missing, packageName, {
      packageName,
      sampleModule,
      sampleVersion,
      baselineModule,
      baselineVersion,
    } as ComparisonResult);

    return results;
  }

  const version = semver.minVersion(sampleVersion);
  if (version && semver.satisfies(version, new semver.Range(baselineVersion))) {
    set(results.satisfied, packageName, {
      packageName,
      sampleModule,
      sampleVersion,
      baselineModule,
      baselineVersion,
    } as ComparisonResult);

    return results;
  }

  set(results.conflicts, packageName, {
    packageName,
    sampleModule,
    sampleVersion,
    baselineModule,
    baselineVersion,
  } as ComparisonResult);

  return results;
};

export const compareDependencies = (sample: ComparisonTarget, baseline: ComparisonTarget) =>
  Object.entries(baseline.dependencies).reduce(
    (results, [packageName, baselineVersion]) =>
      compareDependency(
        packageName,
        sample.name,
        sample.dependencies[packageName],
        baseline.name,
        baselineVersion,
        results,
      ),
    { conflicts: {}, missing: {}, satisfied: {} } as ComparisonResults,
  );

export const compareSharedDependencies = (
  packageSpec: PackageSpec,
  sharedModule: SharedModuleSpec,
) => {
  const sample: ComparisonTarget = {
    name: packageSpec.name,
    dependencies: packageSpec.dependencies || {},
  };
  const baseline: ComparisonTarget = {
    name: sharedModule.name || 'unspecified',
    dependencies: Object.entries(sharedModule.shared).reduce((acc, [key, value]) => {
      const version = isString(value) ? value : value.requiredVersion || value.version;
      return set(acc, key, version);
    }, {} as Record<string, string>),
  };

  return compareDependencies(sample, baseline);
};

export const compareSharedModules = (
  sampleSpec: SharedModuleSpec,
  baselineSpec: SharedModuleSpec,
) => {
  const sample: ComparisonTarget = {
    name: sampleSpec.name || 'Sample',
    dependencies: extractDependencies(sampleSpec),
  };
  const baseline: ComparisonTarget = {
    name: baselineSpec.name || 'Baseline',
    dependencies: extractDependencies(baselineSpec),
  };

  return compareDependencies(sample, baseline);
};

export const printResults = (results: ComparisonResults) => {
  Object.values(results.satisfied).forEach((conflict) => {
    console.log(
      chalk.green(
        `\u2714 Shared dependency ${conflict.packageName}@${conflict.sampleVersion} satisfied in module ${conflict.sampleModule}. Module ${conflict.baselineModule} expects ${conflict.packageName}@${conflict.baselineVersion}`,
      ),
    );
  });
  Object.values(results.missing).forEach((conflict) => {
    console.log(
      chalk.yellow(
        `\u26A0 Shared dependency ${conflict.packageName}@${conflict.baselineVersion} missing in module ${conflict.sampleModule}. Module ${conflict.baselineModule} expects ${conflict.packageName}@${conflict.baselineVersion}`,
      ),
    );
  });
  Object.values(results.conflicts).forEach((conflict) => {
    console.log(
      chalk.red(
        `\u2717 Shared dependency ${conflict.packageName}@${conflict.sampleVersion} conflicts in module ${conflict.sampleModule}. Module ${conflict.baselineModule} expects ${conflict.packageName}@${conflict.baselineVersion}`,
      ),
    );
  });
};
