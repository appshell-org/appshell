#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * @appshell/cli package API
 */
import os from 'os';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readConfig } from '../../config/src/utils/config';
import initConfigHandler, { InitArgs } from './handlers/config/init';
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

const loadConfig = (cPath: string) => {
  const originalDebug = console.debug;

  console.debug = () => {};
  const c = readConfig(cPath);
  console.debug = originalDebug;

  return c;
};
const configPath = process.env.APPSHELL_CONFIG || path.join(os.homedir(), '.appshell', 'config');
const config = loadConfig(configPath);

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
        description: 'Registry with which the app is registered',
      })
      .option('proxyUrl', {
        default: process.env.APPSHELL_PROXY_URL || '',
        type: 'string',
        description: 'Proxy url for calls to get external resources',
        global: true,
      })
      .option('baseRegistry', {
        alias: 'a',
        default: [],
        string: true,
        type: 'array',
        description:
          'One or more base registries to incorporate into the global appshell configuration',
      }) as yargs.Argv<StartArgs>,
  handler: startHandler,
};

const registerManifestCommand: yargs.CommandModule<unknown, RegisterManifestArgs> = {
  command: 'register',
  describe: 'Register one or more appshell manifests',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('registry', {
        description: 'Registry with which the app is registered',
      })
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
      }) as yargs.Argv<RegisterManifestArgs>,
  handler: registerManifestHandler,
};

const deregisterManifestCommand: yargs.CommandModule<unknown, DeregisterManifestArgs> = {
  command: 'deregister',
  describe: 'Deregister one or more appshell manifests',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('key', {
        string: true,
        type: 'array',
        requiresArg: true,
        description: 'One or more keys for manifests to deregister',
      })
      .option('registry', {
        description: 'Registry with which the app is deregistered',
      }) as yargs.Argv<DeregisterManifestArgs>,
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
      .option('proxyUrl', {
        alias: 'p',
        default: process.env.APPSHELL_PROXY_URL || '',
        type: 'string',
        description: 'Proxy url for calls to get external resources',
        global: true,
      })
      .option('registry', {
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
      .option('registry', {
        description: 'Registry against which the app is compared',
      })
      .option('workingDir', {
        alias: 'd',
        default: '.',
        description: 'Working directory to analyze shared dependencies',
      })
      .option('manager', {
        alias: 'm',
        default: 'npm',
        type: 'string',
        choices: ['npm', 'yarn'],
        description: 'Package manager to use for dependency resolution',
      }) as yargs.Argv<OutdatedArgs>,
  handler: outdatedHandler,
};

const syncCommand: yargs.CommandModule<unknown, SyncArgs> = {
  command: 'sync',
  aliases: ['s'],
  describe: 'Sync local dependencies with shared dependencies specified by registry',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs
      .option('registry', {
        description: 'Registry with which the app shared dependencies are synced',
      })
      .option('workingDir', {
        alias: 'd',
        type: 'string',
        default: '.',
        description: 'Working directory to analyze shared dependencies',
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
      }) as yargs.Argv<SyncArgs>,
  handler: syncHandler,
};

const initConfigCommand: yargs.CommandModule<unknown, InitArgs> = {
  command: 'init',
  aliases: ['i'],
  describe: 'Initialize the configuration',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  builder: (yargs) =>
    yargs.option('config', {
      alias: 'c',
      describe: 'Path to the cli config file',
      default: configPath,
      type: 'string',
    }) as yargs.Argv<InitArgs>,
  handler: initConfigHandler,
};

yargs(hideBin(process.argv))
  .option('apiKey', {
    alias: 'k',
    default: process.env.APPSHELL_API_KEY || config.apiKey || '',
    type: 'string',
    description: 'Api key to use for appshell registry',
    global: true,
  })
  .option('apiKeyHeader', {
    alias: 'h',
    default: process.env.APPSHELL_API_KEY_HEADER || config.apiKeyHeader || '',
    type: 'string',
    description: 'Api key to use for appshell registry',
    global: true,
  })
  .option('registry', {
    alias: 'r',
    describe: 'Appshell registry to operate against',
    default: process.env.APPSHELL_REGISTRY || config.registry || './appshell_registry',
    type: 'string',
    global: true,
  })
  .option('verbose', {
    alias: 'v',
    boolean: true,
    default: false,
    type: 'boolean',
    description: 'Verbose output',
    global: true,
  })
  .middleware((argv) => {
    if (!argv.verbose) {
      // eslint-disable-next-line no-console
      console.debug = () => {};
    }
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
  .command({
    command: 'config [target]',
    describe: 'Configures the appshell cli',
    handler: () => {},
    // eslint-disable-next-line @typescript-eslint/no-shadow
    builder: (yargs) => yargs.command(initConfigCommand).demandCommand(),
  })
  .command(outdatedCommand)
  .command(syncCommand)
  .command(registerManifestCommand)
  .command(deregisterManifestCommand)
  .command(startCommand)
  .fail((msg, err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.error(msg);
    }
    console.error('You can use --help to see available options');
    process.exit(1);
  })
  .parse();
