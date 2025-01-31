/* eslint-disable no-console */
import { AppshellGlobalConfig } from './types';
import { isValidUrl, merge } from './utils';
import loadJson from './utils/loadJson';
import { AppshellGlobalConfigValidator } from './validators';

type GenerateGlobalConfigOptions = {
  insecure: boolean;
  apiKey?: string;
};

export default async (
  registries: string[],
  options: GenerateGlobalConfigOptions = { insecure: false },
): Promise<AppshellGlobalConfig> => {
  const defaultGlobalConfig = { index: {}, metadata: {}, overrides: { environment: {} } };

  if (registries.length < 1) {
    console.log(`No registries found. skipping global configuration generation.`);
    return defaultGlobalConfig;
  }

  console.log(
    `generating global appshell configuration --registry=${JSON.stringify(registries, null, 2)}`,
  );

  try {
    const configs = await Promise.all(
      registries.map(async (reg) => {
        const registry = isValidUrl(reg) ? `${reg}/appshell.config.json` : reg;
        console.debug(`Getting config from ${registry}`);
        const config = await loadJson<AppshellGlobalConfig>(registry, {
          insecure: options.insecure,
          target: /(.config.json)/i,
          apiKey: options.apiKey,
        });
        return config;
      }),
    ).then((items) => items.flat());

    console.log(
      `Generating global configuration from ${configs.length} source${
        configs.length === 1 ? '' : 's'
      }`,
    );

    return merge(AppshellGlobalConfigValidator, ...configs) as AppshellGlobalConfig;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error generating global appshell configuration', err.message);
  }

  return defaultGlobalConfig;
};
