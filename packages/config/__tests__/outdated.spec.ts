import { set, unset } from 'lodash';
import outdated from '../src/outdated';
import { ComparisonResult, PackageSpec, SharedObject } from '../src/types';
import testPackage from './assets/package.json';

describe('outdated', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const sharedModuleName = 'my-mfe';
  const sharedDependencies: SharedObject = {
    react: '18.2.0',
    'react-dom': '18.2.0',
    'react-refresh': '^0.14.0',
    'react-spinners': '0.0.8',
    'styled-components': '6.0.0-rc.3',
  };
  const sharedModule = { name: sharedModuleName, shared: sharedDependencies };

  it('should detect conflict when local dependencies are ahead of shared dependencies', async () => {
    const packageSpec = testPackage as PackageSpec;

    const results = await outdated(packageSpec, sharedModule);

    expect(results.conflicts).toMatchObject({
      'react-spinners': {
        packageName: 'react-spinners',
        sampleModule: packageSpec.name,
        sampleVersion: '0.13.8',
        baselineModule: sharedModuleName,
        baselineVersion: '0.0.8',
      } as ComparisonResult,
    });
  });

  it('should detect conflict when local dependencies are behind shared dependencies', async () => {
    const packageSpec = testPackage as PackageSpec;
    set(packageSpec, 'dependencies.react-spinners', '0.0.5');

    const results = await outdated(packageSpec, sharedModule);

    expect(results.conflicts).toMatchObject({
      'react-spinners': {
        packageName: 'react-spinners',
        sampleModule: packageSpec.name,
        sampleVersion: '0.0.5',
        baselineModule: sharedModuleName,
        baselineVersion: '0.0.8',
      } as ComparisonResult,
    });
  });

  it('should use semantic verioning when detecting a match', async () => {
    const packageSpec = testPackage as PackageSpec;
    set(packageSpec, 'dependencies.react-refresh', '0.14.12');

    const results = await outdated(packageSpec, sharedModule);

    expect(results.satisfied['react-refresh']).toMatchObject({
      packageName: 'react-refresh',
      sampleModule: packageSpec.name,
      sampleVersion: '0.14.12',
      baselineModule: sharedModuleName,
      baselineVersion: '^0.14.0',
    } as ComparisonResult);
  });

  it('should detect missing package when local dependencies do not have a shared dependency', async () => {
    const packageSpec = testPackage as PackageSpec;
    unset(packageSpec, 'dependencies.react-spinners');

    const results = await outdated(packageSpec, sharedModule);

    expect(results.conflicts).toMatchObject({});
    expect(results.missing).toMatchObject({
      'react-spinners': {
        packageName: 'react-spinners',
        sampleModule: '@test/my-mfe',
        baselineModule: sharedModuleName,
        baselineVersion: '0.0.8',
      } as ComparisonResult,
    });
  });
});
