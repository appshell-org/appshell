/* eslint-disable no-console */
import { generateGlobalConfig, utils } from '@appshell/config';
import fs from 'fs';
import { isEqual } from 'lodash';
import path from 'path';
import { inspect } from 'util';

export type GenerateGlobalConfigArgs = {
  registry: string[] | undefined;
  apiKey: string;
  apiKeyHeader: string;
  proxyUrl: string;
  validateRegistrySslCert: boolean;
  outDir: string;
  outFile: string;
};

export default async (argv: GenerateGlobalConfigArgs): Promise<void> => {
  const { registry, apiKey, apiKeyHeader, proxyUrl, validateRegistrySslCert, outDir, outFile } =
    argv;
  const registries = registry || [];

  if (registries.length < 1) {
    console.log(`No registries found. skipping global configuration generation.`);
    return;
  }

  console.log(
    `generating global appshell configuration --validate-registry-ssl-cert=${validateRegistrySslCert} --out-dir=${outDir} --out-file=${outFile} --registry=${registries} --api-key=${utils.blur(
      apiKey,
    )} --api-key-header=${apiKeyHeader} --proxy-url=${proxyUrl}`,
  );

  try {
    if (!fs.existsSync(outDir)) {
      console.debug(`creating registry at ${outDir}`);
      fs.mkdirSync(outDir);
    }

    const config = await generateGlobalConfig(registries, {
      insecure: !validateRegistrySslCert,
      apiKey,
      apiKeyHeader,
      proxyUrl,
    });

    console.log(`global appshell configuration generated: ${JSON.stringify(config, null, 2)}`);

    const configPath = path.join(outDir, outFile);
    const currentConfig = JSON.stringify(config, null, 2);
    const existingConfig = fs.existsSync(configPath)
      ? fs.readFileSync(configPath, 'utf-8')
      : undefined;

    if (!isEqual(currentConfig, existingConfig)) {
      console.log(`writing config to ${configPath}`);
      fs.writeFileSync(configPath, currentConfig);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('Error generating global appshell configuration', err.message);
    console.log(inspect(err));
  }
};
