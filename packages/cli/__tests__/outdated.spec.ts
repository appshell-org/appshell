import fs from 'fs';
import https from 'https';
import axios from '../src/axios';
import handler from '../src/handlers/outdated';
import packageSpec from './assets/package.json';
import snapshot from './assets/snapshot.json';

jest.mock('fs');
jest.mock('../src/axios');

describe('outdated', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should throw if package.json not found', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const workingDir = 'does/not/exist';
    const registry = 'http://test.appshell.com';

    await handler({ workingDir, registry, manager: 'npm' });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      expect.anything(),
    );
  });

  it('should throw if package.json not found', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const workingDir = 'does/not/exist';
    const registry = 'http://test.appshell.com';

    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    await handler({ workingDir, registry, manager: 'npm' });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      expect.anything(),
    );
  });

  it('should fetch snapshot from a valid URL', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';

    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValue(JSON.stringify(packageSpec));
    const axiosGetSpy = jest.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: snapshot });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await handler({ workingDir, registry, manager: 'npm', verbose: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      `outdated --working-dir=${workingDir} --registry=${registry} --manager=npm --verbose=true`,
    );
    expect(existsSyncSpy).toHaveBeenCalledWith(`${workingDir}/package.json`);
    expect(readFileSyncSpy).toHaveBeenCalledWith(`${workingDir}/package.json`, 'utf-8');
    expect(axiosGetSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`, {
      httpsAgent: expect.any(https.Agent),
      headers: {
        'X-Api-Key': process.env.APPSHELL_API_KEY,
      },
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should fetch snapshot from a local directory', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = '/path/to/registry';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const existsSyncSpy = jest
      .spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    const readFileSyncSpy = jest
      .spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(JSON.stringify(packageSpec))
      .mockReturnValueOnce(JSON.stringify(snapshot));
    const axiosGetSpy = jest.spyOn(axios, 'get');

    await handler({ workingDir, registry, manager: 'npm', verbose: false });

    expect(consoleSpy).toHaveBeenCalledWith(
      `outdated --working-dir=${workingDir} --registry=${registry} --manager=npm --verbose=false`,
    );
    expect(existsSyncSpy).toHaveBeenCalledWith(`${workingDir}/package.json`);
    expect(readFileSyncSpy).toHaveBeenCalledWith(`${workingDir}/package.json`, 'utf-8');
    expect(existsSyncSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`);
    expect(readFileSyncSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`, 'utf-8');
    expect(axiosGetSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should throw an error if snapshot fetch fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
    jest
      .spyOn(axios, 'get')
      .mockResolvedValue({ status: 500, statusText: 'Internal Server Error' });

    await handler({ workingDir, registry, manager: 'npm', verbose: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      expect.anything(),
    );
  });

  it('should handle and log errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('File read error');
    });

    await handler({ workingDir, registry, manager: 'npm', verbose: true });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      expect.anything(),
    );
  });
});
