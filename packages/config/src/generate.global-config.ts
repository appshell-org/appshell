/* eslint-disable no-console */
import { AppshellGlobalConfig } from './types';
import { isValidUrl, merge } from './utils';
import loadJson from './utils/loadJson';
import { AppshellGlobalConfigValidator } from './validators';

export type GenerateGlobalConfigOptions = {
  insecure: boolean;
  apiKey?: string;
};

export default async (
  registries: string[],
  options: GenerateGlobalConfigOptions = { insecure: false, apiKey: undefined },
): Promise<AppshellGlobalConfig> => {
  const defaultGlobalConfig = { index: {}, metadata: {}, overrides: { environment: {} } };

  if (registries.length < 1) {
    console.log(`No registries found. skipping global configuration generation.`);
    return defaultGlobalConfig;
  }

  console.log(
    `generating global appshell configuration --registry=${JSON.stringify(
      registries,
      null,
      2,
    )} --insecure=${options.insecure} --apiKey=${options.apiKey}`,
  );

  try {
    const configs = await Promise.all(
      registries.map((reg) => {
        const registry = isValidUrl(reg) ? `${reg}/appshell.config.json` : reg;
        console.log(`Loading global configuration from ${registry}`);
        return loadJson<AppshellGlobalConfig>(registry, {
          insecure: options.insecure,
          target: /(.config.json)/i,
          apiKey: options.apiKey,
        });
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
