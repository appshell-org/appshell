/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import util from 'util';
import { writeConfig } from '../../../../config/src/utils';

export type InitArgs = {
  apiKey: string | undefined;
  registry: string | undefined;
  config: string;
};

export default async (argv: InitArgs) => {
  const { apiKey, config, registry } = argv;

  try {
    console.log(`init --api-key=${apiKey} --registry=${registry} --config=${config}`);

    if (!fs.existsSync(config)) {
      console.log(`Creating default configuration file at ${config}`);

      fs.mkdirSync(path.dirname(config), { recursive: true });
    }

    writeConfig(config, {
      apiKey: apiKey || '<Add your API key here>',
      registry: registry || 'http://localhost:3030',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.log('Error initializing appshell cli configuration:', err.message);
    console.log(util.inspect(err));
  }
};
