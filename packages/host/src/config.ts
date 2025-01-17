import _ from 'lodash';

const parseNumber = (value: string | undefined, defaultValue: number) =>
  value && _.isFinite(value) ? parseInt(value, 10) : defaultValue;

const config = {
  publicUrl: process.env.APPSHELL_PUBLIC_URL,
  port: parseNumber(process.env.APPSHELL_PORT, 7070),
  registryPath: process.env.APPSHELL_REGISTRY || '/appshell/appshell_registry',
  root: process.env.APPSHELL_ROOT,
  rootProps: process.env.APPSHELL_ROOT_PROPS,
  baseRegistryUrls: process.env.APPSHELL_BASE_REGISTRY
    ? process.env.APPSHELL_BASE_REGISTRY.split(',')
    : [],
  configUrl: process.env.APPSHELL_CONFIG_URL,
  env: process.env.NODE_ENV || 'development',
  envPath: process.env.APPSHELL_ENV_PATH || '.env',
  envPrefix: process.env.APPSHELL_ENV_PREFIX || 'APPSHELL_',
  envGlobalVar: process.env.APPSHELL_ENV_GLOBAL_VAR || '__appshell_env__',
  favIcon: process.env.APPSHELL_FAVICON || '/favicon.ico',
  themeColor: process.env.APPSHELL_THEME_COLOR,
  primaryColor: process.env.APPSHELL_PRIMARY_COLOR,
  stylesheetUrl: process.env.APPSHELL_STYLESHEET_URL,
  title: process.env.APPSHELL_TITLE || 'Appshell',
  description: process.env.APPSHELL_DESCRIPTION || 'Appshell is awesome!',
  serviceWorkerUrl:
    process.env.APPSHELL_SERVICE_WORKER_URL || '/appshell-service-worker.js',
  verifySSL: process.env.APPSHELL_VERIFY_SSL || true,
  apiKey: process.env.APPSHELL_API_KEY,
  monitorInterval: parseNumber(process.env.APPSHELL_MONITOR_INTERVAL, 5000),
};

export type ConfigSettings = typeof config;

export const ConfigKeys = Object.keys(config).reduce(
  (acc, key) => {
    acc[key] = key;
    return acc;
  },
  {} as Record<keyof typeof config, string>,
);

export default (): ConfigSettings => config;
