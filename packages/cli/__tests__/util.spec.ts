import { HttpStatusCode } from 'axios';
import fs from 'fs';
import https from 'https';
import axios from '../src/util/axios';
import { fetchPackageSpec, fetchSnapshot } from '../src/util/fetch';
import snapshot from './assets/snapshot.json';

jest.mock('fs');
jest.mock('../src/util/axios');

describe('cli util', () => {
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

      const axiosGetSpy = jest
        .spyOn(axios, 'get')
        .mockResolvedValue({ status: HttpStatusCode.Ok, statusText: 'OK', data: snapshot });

      await fetchSnapshot(registry);

      expect(axiosGetSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`, {
        httpsAgent: expect.any(https.Agent),
        headers: {
          'X-Api-Key': process.env.APPSHELL_API_KEY,
        },
      });
    });

    it('should fetch snapshot from a local directory', async () => {
      const registry = '/path/to/registry';
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      const readFileSyncSpy = jest
        .spyOn(fs, 'readFileSync')
        .mockReturnValueOnce(JSON.stringify(snapshot));
      const axiosGetSpy = jest.spyOn(axios, 'get');

      await fetchSnapshot(registry);

      expect(existsSyncSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`);
      expect(readFileSyncSpy).toHaveBeenCalledWith(`${registry}/appshell.snapshot.json`, 'utf-8');
      expect(axiosGetSpy).not.toHaveBeenCalled();
    });

    it('should throw an error if snapshot fetch fails', async () => {
      const registry = 'http://test.appshell.com';
      const response = {
        status: HttpStatusCode.InternalServerError,
        statusText: 'Internal Server Error',
      };
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('{}');
      jest.spyOn(axios, 'get').mockResolvedValue(response);

      await expect(() => fetchSnapshot(registry)).rejects.toThrowError(
        `Failed to fetch from registry ${registry}/appshell.snapshot.json. ${response.status} ${response.statusText}`,
      );
    });
  });
});
