/* eslint-disable no-console */
import chalk from 'chalk';
import { get, keys, set, uniq, values } from 'lodash';
import { validate } from 'schema-utils';
import { Schema } from 'schema-utils/declarations/validate';
import semver from 'semver';
import schema from '../schemas/appshell.manifest.json';
import { AppshellManifest, ConfigValidator, ModuleFederationPluginOptions } from '../types';

const hasIDCollisions = (...documents: AppshellManifest[]) => {
  const allIDs = documents.flatMap((document) =>
    values(document.remotes).map((remote) => remote.id),
  );
  const uniqueIDs = uniq(allIDs);

  return uniqueIDs.length !== allIDs.length;
};

const hasRemoteCollisions = (...documents: AppshellManifest[]) => {
  const allRemoteKeys = documents.flatMap((document) => keys(document.remotes));
  const uniqueRemotes = uniq(allRemoteKeys);

  return uniqueRemotes.length !== allRemoteKeys.length;
};

const hasEnvironmentCollisions = (...documents: AppshellManifest[]) => {
  const allEnvironmentKeys = documents.flatMap((document) => keys(document.environment));
  const uniqueEnvironments = uniq(allEnvironmentKeys);

  return uniqueEnvironments.length !== allEnvironmentKeys.length;
};

const logMissingDependencyVersion = (
  module: ModuleFederationPluginOptions,
  pkg: string,
  version: string | undefined,
) => {
  console.log(
    chalk.magenta(
      `Shared dependency version missing in MFE module ${module.name} for package ${pkg}: ${version}`,
    ),
  );
};

const logDependencyConflict = (
  module: ModuleFederationPluginOptions,
  pkg: string,
  foundVersion: string,
  expectedVersion: string,
) => {
  console.log(
    chalk.magenta(
      `Shared dependency version conflict in MFE module ${module.name} for package ${pkg}: ${foundVersion} does not satisfy ${expectedVersion}`,
    ),
  );
};

const logDependencyMatch = (
  module: ModuleFederationPluginOptions,
  pkg: string,
  expectedVersion: string,
) => {
  console.log(
    chalk.green(
      `Shared dependency version matched in MFE module ${module.name} for package ${pkg}: ${expectedVersion}`,
    ),
  );
};

const processExistingDependency = (
  module: ModuleFederationPluginOptions,
  pkg: string,
  pkgVersion: string,
  expectedVersion: string,
  allConflicts: Record<string, string>,
) => {
  const version = semver.minVersion(pkgVersion);
  if (version && semver.satisfies(version, new semver.Range(expectedVersion))) {
    logDependencyMatch(module, pkg, expectedVersion);
  } else {
    set(allConflicts, pkg, pkgVersion);
    logDependencyConflict(module, pkg, pkgVersion, expectedVersion);
  }
};

const processSharedDependencies = (
  module: ModuleFederationPluginOptions,
  allDependencies: Record<string, string>,
  allConflicts: Record<string, string>,
) => {
  const shared = module.shared || {};

  Object.keys(shared).forEach((pkg) => {
    const version = get(shared, `${pkg}.requiredVersion`) as string | undefined;
    if (!version) {
      logMissingDependencyVersion(module, pkg, version);
      return;
    }

    if (allDependencies[pkg]) {
      processExistingDependency(module, pkg, version, allDependencies[pkg], allConflicts);
    } else {
      set(allDependencies, pkg, version);
    }
  });
};

const hasSharedDependencyConflict = (...documents: AppshellManifest[]) => {
  const allDependencies: Record<string, string> = {};
  const allConflicts: Record<string, string> = {};
  const allModules = documents.flatMap((document) => Object.values(document.modules));

  allModules.forEach((module) => processSharedDependencies(module, allDependencies, allConflicts));

  return Object.values(allConflicts).length !== 0;
};

export default {
  validate: (...documents: AppshellManifest[]) => {
    // schema validation
    documents.forEach((document) => validate(schema as Schema, document));

    // logical validation
    if (hasIDCollisions(...documents)) {
      console.log(chalk.yellow('Multiple remotes with the same ID'));
    }

    if (hasRemoteCollisions(...documents)) {
      console.log(chalk.yellow('Multiple remotes with the same key'));
    }

    if (hasEnvironmentCollisions(...documents)) {
      console.log(chalk.yellow('Multiple environments with the same key'));
    }

    if (hasSharedDependencyConflict(...documents)) {
      console.log(chalk.yellow('Shared dependencies with conflicting versions'));
    }
  },
} as ConfigValidator;
