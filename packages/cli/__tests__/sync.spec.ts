import * as config from '@appshell/config';
import { ComparisonResult } from '@appshell/config';
import { merge } from 'lodash';
import handler from '../src/handlers/sync';
import * as util from '../src/util/fetch';
import packageSpec from './assets/package.json';
import snapshot from './assets/snapshot.json';

jest.mock('../src/util/fetch');

const mockConflicts = (conflicts: Record<string, ComparisonResult>) =>
  merge({ satisfied: {}, missing: {} }, { conflicts });

describe('cli sync', () => {
  const apiKey = 'test-api-key';

  let fetchPackageSpecSpy: jest.SpyInstance;
  let fetchSnapshotSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let outdatedSpy: jest.SpyInstance;
  beforeEach(() => {
    fetchPackageSpecSpy = jest.spyOn(util, 'fetchPackageSpec').mockResolvedValue(packageSpec);
    fetchSnapshotSpy = jest.spyOn(util, 'fetchSnapshot').mockResolvedValue(snapshot);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    outdatedSpy = jest
      .spyOn(config, 'outdated')
      .mockResolvedValueOnce(
        mockConflicts({
          'test-package-1': {
            status: 'conflict',
            packageName: 'test-package-1',
            sampleModule: 'sample-module-1',
            sampleVersion: '2.0.0',
            baselineModule: 'baseline-module-1',
            baselineVersion: '1.0.0',
          },
        }),
      )
      .mockResolvedValueOnce(
        mockConflicts({
          'test-package-2': {
            status: 'conflict',
            packageName: 'test-package-2',
            sampleModule: 'sample-module-1',
            sampleVersion: '3.0.0',
            baselineModule: 'baseline-module-1',
            baselineVersion: '2.0.0',
          },
        }),
      );
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

    await handler({
      apiKey,
      workingDir,
      registry,
      packageManager: 'npm',
      resolutionStrategy: 'latest',
      dryRun: false,
    });

    expect(fetchPackageSpecSpy).toHaveBeenCalledWith(workingDir, apiKey);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error analyzing outdated shared dependencies`,
      errorMessage,
    );
  });

  it('should fetch snapshot from a valid URL', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';
    const modulesToCheck = Object.keys(snapshot.modules).length;
    const syncSpy = jest.spyOn(config, 'sync').mockResolvedValue();

    await handler({
      apiKey,
      workingDir,
      registry,
      packageManager: 'npm',
      resolutionStrategy: 'latest',
      dryRun: false,
    });

    expect(syncSpy).toHaveBeenCalled();
    expect(config.outdated).toHaveBeenCalledTimes(modulesToCheck);
    expect(fetchPackageSpecSpy).toHaveBeenCalledWith(workingDir, apiKey);
    expect(fetchSnapshotSpy).toHaveBeenCalledWith(registry, apiKey);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should fetch snapshot from a local directory', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = '/path/to/registry';
    const modulesToCheck = Object.keys(snapshot.modules).length;
    const syncSpy = jest.spyOn(config, 'sync').mockResolvedValue();

    await handler({
      apiKey,
      workingDir,
      registry,
      packageManager: 'npm',
      resolutionStrategy: 'latest',
      dryRun: false,
    });

    expect(syncSpy).toHaveBeenCalled();
    expect(config.outdated).toHaveBeenCalledTimes(modulesToCheck);
    expect(fetchPackageSpecSpy).toHaveBeenCalledWith(workingDir, apiKey);
    expect(fetchSnapshotSpy).toHaveBeenCalledWith(registry, apiKey);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should throw an error if snapshot fetch fails', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';
    fetchSnapshotSpy.mockRejectedValueOnce(new Error('Snapshot fetch failed'));

    await handler({
      apiKey,
      workingDir,
      registry,
      packageManager: 'npm',
      resolutionStrategy: 'latest',
      dryRun: false,
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      'Snapshot fetch failed',
    );
  });

  it('should handle and log errors', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';
    fetchSnapshotSpy.mockRejectedValueOnce(new Error('Snapshot fetch failed'));

    await handler({
      apiKey,
      workingDir,
      registry,
      packageManager: 'npm',
      resolutionStrategy: 'latest',
      dryRun: false,
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error analyzing outdated shared dependencies',
      expect.anything(),
    );
  });

  it('should capture multiple versions of the same package that are conflicted', async () => {
    const workingDir = '/path/to/workingDir';
    const registry = 'http://test.appshell.com';
    const syncDependenciesSpy = jest.spyOn(config, 'sync').mockResolvedValue();
    outdatedSpy.mockResolvedValueOnce(
      mockConflicts({
        'test-package-2': {
          status: 'conflict',
          packageName: 'test-package-2',
          sampleModule: 'sample-module-1',
          sampleVersion: '3.0.0',
          baselineModule: 'baseline-module-2',
          baselineVersion: '^2.3.0',
        },
      }),
    );

    await handler({
      apiKey,
      workingDir,
      registry,
      packageManager: 'npm',
      resolutionStrategy: 'latest',
      dryRun: false,
    });

    expect(syncDependenciesSpy).toHaveBeenCalledWith(
      workingDir,
      registry,
      {
        'test-package-1@1.0.0': {
          status: 'conflict',
          packageName: 'test-package-1',
          sampleModule: 'sample-module-1',
          sampleVersion: '2.0.0',
          baselineModule: 'baseline-module-1',
          baselineVersion: '1.0.0',
        },
        'test-package-2@2.0.0': {
          status: 'conflict',
          packageName: 'test-package-2',
          sampleModule: 'sample-module-1',
          sampleVersion: '3.0.0',
          baselineModule: 'baseline-module-1',
          baselineVersion: '2.0.0',
        },
        'test-package-2@^2.3.0': {
          status: 'conflict',
          packageName: 'test-package-2',
          sampleModule: 'sample-module-1',
          sampleVersion: '3.0.0',
          baselineModule: 'baseline-module-2',
          baselineVersion: '^2.3.0',
        },
      },
      'latest',
      'npm',
      false,
    );
  });
});
