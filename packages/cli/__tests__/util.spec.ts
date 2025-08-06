import { HttpStatusCode } from 'axios';
import fs from 'fs';
import axios from '../src/util/axios';
import { fetchPackageSpec, fetchSnapshot } from '../src/util/fetch';
import snapshot from './assets/snapshot.json';

jest.mock('fs');
jest.mock('../src/util/axios');

describe('cli util', () => {
  const apiKey = 'test-api-key';
  const apiKeyHeader = 'test-api-key-header';

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('fetchPackageSpec', () => {
    it('should throw if package.json not found', async () => {
      const workingDir = 'does/not/exist';
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);

      await expect(() => fetchPackageSpec(workingDir)).rejects.toThrowError(
        `Package spec not found at ${workingDir}/package.json`,
      );
    });

    it('should throw if package.json not found', async () => {
      const workingDir = 'does/not/exist';
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(() => fetchPackageSpec(workingDir)).rejects.toThrowError(
        `Package spec not found at ${workingDir}/package.json`,
      );
    });
  });

  describe('fetchSnapshot', () => {
    it('should fetch snapshot from a valid URL', async () => {
      const registry = 'http://test.appshell.com';

      const axiosGetSpy = jest.spyOn(axios, 'get').mockResolvedValue({
        headers: { 'content-type': 'application/json' },
        status: HttpStatusCode.Ok,
        statusText: 'OK',
        data: snapshot,
      });

      await fetchSnapshot(registry, apiKey, apiKeyHeader);

      expect(axiosGetSpy).toHaveBeenCalledWith(
        `${registry}/appshell.snapshot.json`,
        expect.objectContaining({
          headers: {
            [apiKeyHeader]: apiKey,
          },
          httpsAgent: expect.anything(),
        }),
      );
    });

    it('should fetch snapshot from a local directory', async () => {
      const registry = '/path/to/registry';
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      const readFileSyncSpy = jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValueOnce(JSON.stringify(snapshot));
      const axiosGetSpy = jest.spyOn(axios, 'get');

      await fetchSnapshot(registry, apiKey, apiKeyHeader);

      expect(existsSyncSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`);
      expect(readFileSyncSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`, 'utf-8');
      expect(axiosGetSpy).not.toHaveBeenCalled();
    });

    it('should throw an error if snapshot fetch fails', async () => {
      const registry = 'http://test.appshell.com';
      const response = {
        headers: { 'content-type': 'application/json' },
        status: HttpStatusCode.InternalServerError,
        statusText: 'Internal Server Error',
      };
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
      jest.spyOn(axios, 'get').mockResolvedValue(response);

      await expect(() => fetchSnapshot(registry, apiKey, apiKeyHeader)).rejects.toThrowError(
        `Failed to fetch from registry ${registry}/appshell.snapshot.json. ${response.status} ${response.statusText}`,
      );
    });

    it('should throw an error if response does not contain the correct content type', async () => {
      const registry = 'http://test.appshell.com';
      const response = {
        headers: { 'content-type': 'text/html' },
        status: HttpStatusCode.InternalServerError,
        statusText: 'Internal Server Error',
      };
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
      jest.spyOn(axios, 'get').mockResolvedValue(response);

      await expect(() => fetchSnapshot(registry, apiKey, apiKeyHeader)).rejects.toThrowError(
        `Failed to fetch from registry ${registry}/appshell.snapshot.json. Invalid content type. text/html`,
      );
    });
  });
});
