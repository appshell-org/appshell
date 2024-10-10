#!/usr/bin/env node

/**
 * @appshell/cli package API
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import deregisterManifestHandler, { DeregisterManifestArgs } from './handlers/deregister';
import generateEnvHandler, { GenerateEnvArgs } from './handlers/generate.env';
import generateGlobalConfigHandler, {
  GenerateGlobalConfigArgs,
} from './handlers/generate.global-config';
import generateManifestHandler, { GenerateManifestArgs } from './handlers/generate.manifest';
import outdatedHandler, { OutdatedArgs } from './handlers/outdated';
import registerManifestHandler, { RegisterManifestArgs } from './handlers/register';
import startHandler, { StartArgs } from './handlers/start';
import syncHandler, { SyncArgs } from './handlers/sync';

const startCommand: yargs.CommandModule<unknown, StartArgs> = {
  command: 'start',
  describe: 'Start the appshell runtime environment',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('outDir', {
        alias: 'o',
        default: 'dist',
        type: 'string',
        description: 'Output directory for files',
      })
      .option('env', {
        alias: 'e',
        default: '.env',
        type: 'string',
        description: 'The .env file to process',
      })
      .option('envPrefix', {
        alias: 'p',
        default: '',
        type: 'string',
        description: 'Only capture environment variables that start with prefix',
      })
      .option('envGlobalName', {
        alias: 'g',
        default: '__appshell_env__',
        type: 'string',
        description: 'Global variable name window[globalName] used in the output js',
      })
      .option('remote', {
        default: false,
        type: 'boolean',
        description: 'Flag if this app is a remote',
      })
      .option('host', {
        default: false,
        type: 'boolean',
        description: 'Flag if this app is a host',
      })
      .option('allowOverrides', {
        default: false,
        boolean: false,
        type: 'boolean',
        description: 'Allow overrides to be propagated',
      })
      .option('validateRegistrySslCert', {
        alias: 'v',
        default: true,
        type: 'boolean',
        description:
          "If false, registry files are fetched without validating the registry's SSL cert",
      })
      .option('metadata', {
        default: false,
        type: 'boolean',
        description: 'Flag if metadata should be produced',
      })
      .option('manifestTemplate', {
        alias: 't',
        default: 'appshell.template.json',
        type: 'string',
        description: 'Path to the appshell config template to process',
      })
      .option('manifest', {
        alias: 'm',
        default: 'appshell.manifest.json',
        type: 'string',
        description: 'One or more manifests to register',
      })
      .option('registry', {
        alias: 'r',
        default: './appshell_registry',
        type: 'string',
        description: 'Registry with which the app is registered',
      })
      .option('baseRegistry', {
        alias: 'a',
        default: [],
        string: true,
        type: 'array',
        description:
          'One or more base registries to incorporate into the global appshell configuration',
      }),
  handler: startHandler,
};

const registerManifestCommand: yargs.CommandModule<unknown, RegisterManifestArgs> = {
  command: 'register',
  describe: 'Register one or more appshell manifests',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('manifest', {
        alias: 'm',
        string: true,
        type: 'array',
        requiresArg: true,
        description: 'One or more manifests to register',
      })
      .option('allowOverrides', {
        default: false,
        boolean: false,
        type: 'boolean',
        description: 'Allow overrides to be propagated',
      })
      .option('registry', {
        alias: 'r',
        default: 'appshell_registry',
        type: 'string',
        description: 'Registry path for the appshell manifests',
      }),
  handler: registerManifestHandler,
};

const deregisterManifestCommand: yargs.CommandModule<unknown, DeregisterManifestArgs> = {
  command: 'deregister',
  describe: 'Deregister one or more appshell manifests',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('key', {
        alias: 'k',
        string: true,
        type: 'array',
        requiresArg: true,
        description: 'One or more keys for manifests to deregister',
      })
      .option('registry', {
        alias: 'r',
        default: 'appshell_registry',
        type: 'string',
        description: 'Registry path for the appshell manifests',
      }),
  handler: deregisterManifestHandler,
};

const generateGlobalConfigCommand: yargs.CommandModule<unknown, GenerateGlobalConfigArgs> = {
  command: 'global-config',
  describe:
    'Generate the global appshell configuration by merging sources specifed by --registry options',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('outDir', {
        alias: 'o',
        default: 'dist',
        type: 'string',
        description: 'Output location for the global appshell configuration',
      })
      .option('outFile', {
        alias: 'f',
        default: 'appshell.config.json',
        type: 'string',
        description: 'Output filename for the global appshell configuration',
      })
      .option('validateRegistrySslCert', {
        alias: 'v',
        default: true,
        type: 'boolean',
        description:
          "If false, registry files are fetched without validating the registry's SSL cert",
      })
      .option('registry', {
        alias: 'r',
        string: true,
        type: 'array',
        requiresArg: true,
        description:
          'One or more registries to query for other global configurations to merge into a single global appshell configuration',
      }),
  handler: generateGlobalConfigHandler,
};

const generateManifestCommand: yargs.CommandModule<unknown, GenerateManifestArgs> = {
  command: 'manifest',
  describe: 'Generate the appshell manifest by processing the template specified by --template',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('template', {
        alias: 't',
        default: 'appshell.template.json',
        type: 'string',
        description: 'Path to the appshell config template to process',
      })
      .option('outDir', {
        alias: 'o',
        default: 'dist',
        requiresArg: true,
        type: 'string',
        description: 'Output location for the appshell manifest',
      })
      .option('outFile', {
        alias: 'f',
        default: 'appshell.manifest.json',
        type: 'string',
        description: 'Output filename for the appshell manifest',
      }),
  handler: generateManifestHandler,
};

const generateEnvCommand: yargs.CommandModule<unknown, GenerateEnvArgs> = {
  command: 'env',
  describe: 'Generate the runtime environment js file that reflects the current process.env',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('env', {
        alias: 'e',
        default: '.env',
        type: 'string',
        description: 'The .env file to process',
      })
      .option('outDir', {
        alias: 'o',
        default: 'dist',
        requiresArg: true,
        type: 'string',
        description: 'Output location for the runtime environment js',
      })
      .option('outFile', {
        alias: 'f',
        default: 'appshell.env.js',
        type: 'string',
        description: 'Output filename for the runtime environment js',
      })
      .option('prefix', {
        alias: 'p',
        default: '',
        type: 'string',
        description: 'Only capture environment variables that start with prefix',
      })
      .option('globalName', {
        alias: 'g',
        default: '__appshell_env__',
        type: 'string',
        description: 'Global variable name window[globalName] used in the output js',
      })
      .option('overwrite', {
        alias: 'w',
        default: false,
        type: 'boolean',
        description:
          'If true, values in --env take precendent over those currently set in the environment',
      }),
  handler: generateEnvHandler,
};

const outdatedCommand: yargs.CommandModule<unknown, OutdatedArgs> = {
  command: 'outdated',
  aliases: ['o'],
  describe: 'Analyzes shared dependencies for outdated versions',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('workingDir', {
        alias: 'd',
        default: '.',
        description: 'Working directory to analyze shared dependencies',
      })
      .option('registry', {
        alias: 'r',
        default: 'appshell_registry',
        type: 'string',
        description: 'Registry path or url against which to compare shared dependencies',
      })
      .option('manager', {
        alias: 'm',
        default: 'npm',
        type: 'string',
        choices: ['npm', 'yarn'],
        description: 'Package manager to use for dependency resolution',
      }),
  handler: outdatedHandler,
};

const syncCommand: yargs.CommandModule<unknown, SyncArgs> = {
  command: 'sync',
  aliases: ['s'],
  describe: 'Sync local dependencies with shared dependencies specified by registry',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('workingDir', {
        alias: 'd',
        type: 'string',
        default: '.',
        description: 'Working directory to analyze shared dependencies',
      })
      .option('registry', {
        alias: 'r',
        type: 'string',
        default: 'appshell_registry',
        description: 'Registry path or url to which shared dependencies are synchronized',
      })
      .option('resolutionStrategy', {
        alias: 's',
        type: 'string',
        default: 'highest',
        choices: ['highest', 'lowest'] as const,
        description:
          'Resolution strategy for dealing with multiple conflicts against the same package',
      })
      .option('packageManager', {
        alias: 'm',
        type: 'string',
        default: 'npm',
        choices: ['npm', 'yarn'] as const,
        description: 'Package manager to use for dependency resolution',
      })
      .option('dryRun', {
        boolean: true,
        default: false,
        type: 'boolean',
        description: 'Perform a dry run without actually syncing dependencies',
      }),
  handler: syncHandler,
};

yargs(hideBin(process.argv))
  .middleware((argv) => {
    if (!argv.verbose) {
      // eslint-disable-next-line no-console
      console.debug = () => {};
    }
  })
  .option('verbose', {
    alias: 'v',
    boolean: true,
    default: false,
    type: 'boolean',
    description: 'Verbose output',
  })
  .command({
    command: 'generate [target]',
    describe: 'Generates a resource',
    handler: () => {},
    // eslint-disable-next-line @typescript-eslint/no-shadow
    builder: (yargs) =>
      yargs
        .command(generateManifestCommand)
        .command(generateEnvCommand)
        .command(generateGlobalConfigCommand)
        .demandCommand(),
  })
  .command(outdatedCommand)
  .command(syncCommand)
  .command(registerManifestCommand)
  .command(deregisterManifestCommand)
  .command(startCommand)
  .parse();
