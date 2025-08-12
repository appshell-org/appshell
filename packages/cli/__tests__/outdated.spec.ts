import * as config from '@appshell/config';
import { ComparisonResults } from '../../config/src/types';
import handler from '../src/handlers/outdated';
import * as util from '../src/util/fetch';
import outdatedResults from './assets/outdated.results.json';
import packageSpec from './assets/package.json';
import snapshot from './assets/snapshot.json';

jest.mock('../src/util/fetch');

describe('cli outdated', () => {
  const apiKey = 'test-api-key';
  const apiKeyHeader = 'test-api-key-header';
  const testResults = outdatedResults as ComparisonResults;
  let fetchPackageSpecSpy: jest.SpyInstance;
  let fetchSnapshotSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    fetchPackageSpecSpy = jest.spyOn(util, 'fetchPackageSpec').mockResolvedValue(packageSpec);
    fetchSnapshotSpy = jest.spyOn(util, 'fetchSnapshot').mockResolvedValue(snapshot);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should throw if package.json not found', async () => {
    const workingDir = 'does/not/exist';
    const registry = 'http://test.appshell.com';
    const errorMessage = `Package spec not found at ${workingDir}/package.json`;
    fetchPackageSpecSpy.mockRejectedValueOnce(new Error(errorMessage));

    await handler({ apiKey, apiKeyHeader, workingDir, registry, manager: 'npm' });

    expect(fetchPackageSpecSpy).toHaveBeenCalledWith(workingDir, apiKey, apiKeyHeader);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error analyzing outdated shared dependencies`,
      errorMessage,
    );
  });

  it('should fetch snapshot from a valid URL', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';
    const modulesToCheck = Object.keys(snapshot.modules).length;
    const outdatedSpy = jest.spyOn(config, 'outdated').mockResolvedValue(testResults);

    await handler({ apiKey, apiKeyHeader, workingDir, registry, manager: 'npm' });

    expect(outdatedSpy).toHaveBeenCalledTimes(modulesToCheck);
    expect(fetchPackageSpecSpy).toHaveBeenCalledWith(workingDir, apiKey, apiKeyHeader);
    expect(fetchSnapshotSpy).toHaveBeenCalledWith(registry, apiKey, apiKeyHeader);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should fetch snapshot from a local directory', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = '/path/to/registry';
    const modulesToCheck = Object.keys(snapshot.modules).length;
    const outdatedSpy = jest.spyOn(config, 'outdated').mockResolvedValue(testResults);

    await handler({ apiKey, apiKeyHeader, workingDir, registry, manager: 'npm' });

    expect(outdatedSpy).toHaveBeenCalledTimes(modulesToCheck);
    expect(fetchPackageSpecSpy).toHaveBeenCalledWith(workingDir, apiKey, apiKeyHeader);
    expect(fetchSnapshotSpy).toHaveBeenCalledWith(registry, apiKey, apiKeyHeader);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should throw an error if snapshot fetch fails', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';
    fetchSnapshotSpy.mockRejectedValueOnce(new Error('Snapshot fetch failed'));

    await handler({ apiKey, apiKeyHeader, workingDir, registry, manager: 'npm' });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      'Snapshot fetch failed',
    );
  });

  it('should handle and log errors', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';
    fetchSnapshotSpy.mockRejectedValueOnce(new Error('Snapshot fetch failed'));

    await handler({ apiKey, apiKeyHeader, workingDir, registry, manager: 'npm' });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      expect.anything(),
    );
  });
});
