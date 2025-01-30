/* eslint-disable no-console */
import { generateGlobalConfig, utils } from '@appshell/config';
import fs from 'fs';
import { isEqual } from 'lodash';
import path from 'path';

export type GenerateGlobalConfigArgs = {
  registry: string[] | undefined;
  apiKey: string;
  validateRegistrySslCert: boolean;
  outDir: string;
  outFile: string;
};

export default async (argv: GenerateGlobalConfigArgs): Promise<void> => {
  const { registry, apiKey, validateRegistrySslCert, outDir, outFile } = argv;
  const registries = registry || [];

  if (registries.length < 1) {
    console.log(`No registries found. skipping global configuration generation.`);
    return;
  }

  console.log(
    `generating global appshell configuration --validate-registry-ssl-cert=${validateRegistrySslCert} --out-dir=${outDir} --out-file=${outFile} --registry=${registries} --api-key=${utils.blur(
      apiKey,
    )}`,
  );

  try {
    const config = await generateGlobalConfig(registries, {
      insecure: !validateRegistrySslCert,
      apiKey,
    });

    console.log(`global appshell configuration generated: ${JSON.stringify(config, null, 2)}`);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }

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
  }
};
