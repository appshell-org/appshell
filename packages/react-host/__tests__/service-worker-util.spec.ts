import { enableFetchMocks } from 'jest-fetch-mock';
import { mockDeep } from 'jest-mock-extended';
import {
  getBaseDomain,
  headersToObject,
  isDevelopment,
  isExternalDomain,
} from '../src/worker/util';

enableFetchMocks();

describe('service-worker utls', () => {
  const workerLocation: Location = mockDeep<Location>({ origin: 'https://example.com' });

  describe('getBaseDomain', () => {
    it('should return the base domain for a given URL', () => {
      const url = 'https://www.example.com/path/to/page';
      const baseDomain = getBaseDomain(url);
      expect(baseDomain).toBe('example.com');
    });

    it('should return the base domain for a URL without subdomains', () => {
      const url = 'https://example.com';
      const baseDomain = getBaseDomain(url);
      expect(baseDomain).toBe('example.com');
    });

    it('should return the base domain for a URL with multiple subdomains', () => {
      const url = 'https://sub1.sub2.example.com';
      const baseDomain = getBaseDomain(url);
      expect(baseDomain).toBe('example.com');
    });
  });

  describe('isExternalDomain', () => {
    it('should return true if the request URL has a different base domain than the referrer URL', () => {
      const requestUrl = 'https://www.some-other-domain.com/path/to/resource';

      const result = isExternalDomain(requestUrl, workerLocation.origin);

      expect(result).toBe(true);
    });

    it('should return false if the request URL has the same base domain as the referrer URL', () => {
      const requestUrl = 'https://example.com/path/to/resource';

      const result = isExternalDomain(requestUrl, workerLocation.origin);

      expect(result).toBe(false);
    });

    it('should return false if the request URL is a subdomain of the referrer URL', () => {
      const requestUrl = 'https://sub.example.com/path/to/resource';

      const result = isExternalDomain(requestUrl, workerLocation.origin);

      expect(result).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return false if the origin was other than localhost', () => {
      const originUrl = 'https://www.non-local-domain.com/path/to/resource';

      const result = isDevelopment(originUrl);

      expect(result).toBe(false);
    });

    it('should return true if the origin is localhost', () => {
      const originUrl = 'https://localhost:3001/path/to/resource';

      const result = isDevelopment(originUrl);

      expect(result).toBe(true);
    });

    it('should return true if the origin is a subdomain of localhost', () => {
      const originUrl = 'https://sub.localhost:3001/path/to/resource';

      const result = isDevelopment(originUrl);

      expect(result).toBe(false);
    });
  });

  describe('headersToObject', () => {
    it('should convert Headers object to an object', () => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Authorization', 'Bearer token');

      const result = headersToObject(headers);

      expect(result).toEqual({
        'content-type': 'application/json',
        authorization: 'Bearer token',
      });
    });

    it('should return an empty object if Headers object is empty', () => {
      const headers = new Headers();

      const result = headersToObject(headers);

      expect(result).toEqual({});
    });
  });
});
