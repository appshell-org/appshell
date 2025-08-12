import fs from 'fs';
import path from 'path';
import { rimrafSync } from 'rimraf';
import generateEnvHandler from '../src/handlers/generate.env';

describe('generate.env', () => {
  const prefix = '';
  const outDir = path.resolve('packages/cli/__tests__/assets/temp');
  const outFile = 'appshell.env.js';
  const globalName = 'appshell_env';

  beforeAll(() => {
    process.env.REGISTRY = 'packages/cli/__tests__/assets/appshell_registry';
    process.env.ROOT = 'TestModule/Workspace';
    process.env.TEST_ENV_FOO = 'foo';
    process.env.TEST_ENV_BAR = 'bar';
  });

  afterAll(() => {
    delete process.env.REGISTRY;
    delete process.env.ROOT;
    delete process.env.TEST_ENV_FOO;
    delete process.env.TEST_ENV_BAR;
  });

  afterEach(() => {
    rimrafSync(outDir);
  });

  it('should generate the runtime environment js file', async () => {
    await generateEnvHandler({
      prefix: '^(TEST_|REGISTRY|ROOT).*',
      outDir,
      outFile,
      globalName,
    });
    const actual = fs.readFileSync(path.join(outDir, outFile));

    expect(actual.toString()).toMatchSnapshot();
  });

  it('should capture only prefixed environment vars when prefix is supplied', async () => {
    await generateEnvHandler({
      prefix: 'TEST_',
      outDir,
      outFile,
      globalName,
    });
    const actual = fs.readFileSync(path.join(outDir, outFile));

    expect(actual.toString()).toMatchSnapshot();
  });

  it('should output to outDir when supplied', async () => {
    const testPath = path.resolve('packages/cli/__tests__/assets/temp/test');
    await generateEnvHandler({
      prefix,
      outDir: testPath,
      outFile,
      globalName,
    });
    const actual = fs.readFileSync(path.join(testPath, outFile));

    expect(actual.toString()).toBeTruthy();
  });

  it('should output with outFile name when supplied', async () => {
    const filename = 'test.env.js';
    await generateEnvHandler({
      prefix,
      outDir,
      outFile: filename,
      globalName,
    });
    const actual = fs.readFileSync(path.join(outDir, filename));

    expect(actual.toString()).toBeTruthy();
  });

  it('should output with global variable name supplied', async () => {
    const testGlobalName = 'my_global_var';
    await generateEnvHandler({
      prefix,
      outDir,
      outFile,
      globalName: testGlobalName,
    });
    const actual = fs.readFileSync(path.join(outDir, outFile));

    expect(actual.includes(`window.${testGlobalName}`)).toBe(true);
  });
});
