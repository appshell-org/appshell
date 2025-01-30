export const getBaseDomain = (url: string): string => {
  const urlObj = new URL(url);
  const domainParts = urlObj.hostname.split('.');
  const baseDomainParts = domainParts.slice(-2);

  return baseDomainParts.join('.');
};

export const isExternalDomain = (requestUrl: string, origin: string): boolean => {
  const requestBaseDomain = getBaseDomain(requestUrl);
  const referrerBaseDomain = getBaseDomain(origin);

  return requestBaseDomain !== referrerBaseDomain;
};

export const headersToObject = (headers: Headers) => {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};

export const isDevelopment = (origin: string): boolean => {
  const referrerBaseDomain = getBaseDomain(origin);
  return referrerBaseDomain === 'localhost';
};
