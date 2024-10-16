import util, { ChildProcess } from 'child_process';
import { mockDeep } from 'jest-mock-extended';
import sync, * as syncModule from '../src/sync';

describe('sync', () => {
  const workingDir = '/path/to/workingDir';
  const registry = 'http://test.appshell.com';
  const outOfSync = {
    'test-package-1@1.0.0': {
      status: 'conflict' as 'conflict' | 'missing' | 'satisfied',
      packageName: 'test-package-1',
      sampleModule: 'sample-module-1',
      sampleVersion: '2.0.0',
      baselineModule: 'baseline-module-1',
      baselineVersion: '1.0.0',
    },
    'test-package-2@2.0.0': {
      status: 'conflict' as 'conflict' | 'missing' | 'satisfied',
      packageName: 'test-package-2',
      sampleModule: 'sample-module-1',
      sampleVersion: '3.0.0',
      baselineModule: 'baseline-module-1',
      baselineVersion: '2.0.0',
    },
  };

  const duplicateConflicts = {
    'test-package-2@^2.3.0': {
      status: 'conflict' as 'conflict' | 'missing' | 'satisfied',
      packageName: 'test-package-2',
      sampleModule: 'sample-module-1',
      sampleVersion: '3.0.0',
      baselineModule: 'baseline-module-2',
      baselineVersion: '^2.3.0',
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should sync all dependencies', async () => {
    const syncDependenciesSpy = jest
      .spyOn(syncModule, 'syncDependencies')
      .mockImplementationOnce(() => Promise.resolve());

    await sync(workingDir, registry, outOfSync);

    expect(syncDependenciesSpy).toHaveBeenCalledWith(
      workingDir,
      registry,
      ['test-package-1@1.0.0', 'test-package-2@2.0.0'],
      expect.anything(),
    );
  });

  it('should sync highest compatable package when multiple conflicts occur with the same package', async () => {
    const syncDependenciesSpy = jest
      .spyOn(syncModule, 'syncDependencies')
      .mockImplementationOnce(() => Promise.resolve());

    await sync(workingDir, registry, {
      ...outOfSync,
      ...duplicateConflicts,
    });

    expect(syncDependenciesSpy).toHaveBeenCalledWith(
      workingDir,
      registry,
      ['test-package-1@1.0.0', 'test-package-2@^2.3.0'],
      expect.anything(),
    );
  });

  it('should sync lowest compatable package when multiple conflicts occur with the same package', async () => {
    const syncDependenciesSpy = jest
      .spyOn(syncModule, 'syncDependencies')
      .mockImplementationOnce(() => Promise.resolve());

    await sync(
      workingDir,
      registry,
      {
        ...outOfSync,
        ...duplicateConflicts,
      },
      'lowest',
    );

    expect(syncDependenciesSpy).toHaveBeenCalledWith(
      workingDir,
      registry,
      ['test-package-1@1.0.0', 'test-package-2@2.0.0'],
      expect.anything(),
    );
  });

  it('should not execute actual sync when dryRun is true', async () => {
    const syncDependenciesSpy = jest
      .spyOn(syncModule, 'syncDependencies')
      .mockImplementationOnce(() => Promise.resolve());

    await sync(
      workingDir,
      registry,
      {
        ...outOfSync,
        ...duplicateConflicts,
      },
      'lowest',
      'npm',
      true,
    );

    expect(syncDependenciesSpy).not.toHaveBeenCalled();
  });

  describe('syncDependencies', () => {
    const mockDataHandler = jest.fn();
    const mockExitHandler = jest.fn();

    const mockOn = jest.fn((event: string, handler: () => void) => {
      if (event === 'data') {
        mockDataHandler.mockImplementationOnce(handler);
      } else if (event === 'exit') {
        mockExitHandler.mockImplementationOnce(handler);
      }
    }) as any;

    let execSpy: jest.SpyInstance;
    beforeEach(() => {
      execSpy = jest
        .spyOn(util, 'exec')
        .mockReturnValueOnce(mockDeep<ChildProcess>({ on: mockOn, stdout: { on: mockOn } }));
    });

    afterEach(() => {
      mockDataHandler.mockRestore();
      mockExitHandler.mockRestore();
    });

    it('should install dependencies using npm', async () => {
      setTimeout(() => mockDataHandler('installing packages'), 500);
      setTimeout(() => mockExitHandler(0), 1000);

      await syncModule.syncDependencies(
        workingDir,
        registry,
        ['test-package-1@1.0.0', 'test-package-2@2.0.0'],
        'npm',
      );

      expect(execSpy).toHaveBeenCalledWith(
        `cd ${workingDir} && npm install test-package-1@1.0.0 test-package-2@2.0.0`,
      );
    });

    it('should install dependencies using yarn', async () => {
      setTimeout(() => mockDataHandler('installing packages'), 500);
      setTimeout(() => mockExitHandler(0), 1000);

      await syncModule.syncDependencies(
        workingDir,
        registry,
        ['test-package-1@1.0.0', 'test-package-2@2.0.0'],
        'yarn',
      );

      expect(execSpy).toHaveBeenCalledWith(
        `cd ${workingDir} && yarn add test-package-1@1.0.0 test-package-2@2.0.0`,
      );
    });
  });
});
