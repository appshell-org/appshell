/* eslint-disable no-console */
import chalk from 'chalk';
import { keys, uniq, values } from 'lodash';
import { validate } from 'schema-utils';
import { Schema } from 'schema-utils/declarations/validate';
import schema from '../schemas/appshell.manifest.json';
import { AppshellManifest, ConfigValidator, SharedObject } from '../types';
import { compareSharedModules, printResults } from '../utils/compare';

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

const hasSharedDependencyConflict = (...documents: AppshellManifest[]) => {
  const allModules = documents.flatMap((document) => Object.values(document.modules));
  const allConflicts = allModules.map((module, i, arr) => {
    if (i < arr.length - 1) {
      const sample = {
        name: arr[i + 1].name || `Module ${i + 1}`,
        shared: arr[i + 1].shared as SharedObject,
      };
      const baseline = {
        name: module.name || `Module ${i}`,
        shared: module.shared as SharedObject,
      };

      return compareSharedModules(sample, baseline);
    }

    return { conflicts: {}, missing: {}, satisfied: {} };
  });

  allConflicts.forEach((conflict) => printResults(conflict));

  return (
    allConflicts.reduce((acc, results) => acc + Object.values(results.conflicts).length, 0) !== 0
  );
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
