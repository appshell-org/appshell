// init.test.ts
import fs from 'fs';
import util from 'util';
import * as config from '../../config/src/utils/config';
import init, { InitArgs } from '../src/handlers/config/init';

jest.mock('fs');
jest.mock('../../config/src/utils/config');

describe('init', () => {
  const consoleLogSpy = jest.spyOn(console, 'log');
  const existsSyncSpy = jest.spyOn(fs, 'existsSync');
  const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');
  const writeConfigSpy = jest.spyOn(config, 'writeConfig');

  beforeEach(() => {
    consoleLogSpy.mockClear();
    existsSyncSpy.mockClear();
    mkdirSyncSpy.mockClear();
    writeConfigSpy.mockClear();
  });

  it('should initialize with default values if none are provided', async () => {
    const args: InitArgs = {
      apiKey: undefined,
      registry: undefined,
      config: 'defaultConfig',
    };

    existsSyncSpy.mockReturnValue(false);

    await init(args);

    expect(existsSyncSpy).toHaveBeenCalledWith(args.config);
    expect(mkdirSyncSpy).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(writeConfigSpy).toHaveBeenCalledWith(args.config, {
      apiKey: '<Add your API key here>',
      registry: 'http://localhost:3030',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `init --api-key=${args.apiKey} --registry=${args.registry} --config=${args.config}`,
    );
  });

  it('should handle errors gracefully', async () => {
    const args: InitArgs = {
      apiKey: 'testKey',
      registry: 'testRegistry',
      config: 'testConfig',
    };
    const inspectSpy = jest.spyOn(util, 'inspect').mockImplementation(() => '');

    const error = new Error('test error');
    existsSyncSpy.mockImplementation(() => {
      throw error;
    });

    await init(args);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Error initializing appshell cli configuration:',
      error.message,
    );
    expect(inspectSpy).toHaveBeenCalledWith(error);
  });
});
