const shouldProcess = (line: string, prefixRegex: RegExp) =>
  !line.match(/^(\s*|#.*)$/) && prefixRegex.test(line);

export default async (prefix = '') =>
  new Promise<Map<string, string | undefined>>((resolve, reject) => {
    try {
      const map = new Map<string, string | undefined>();
      // Check if the prefix appears to be a regex pattern (contains special regex chars)
      const isRegexPattern = /[()|[\]{}^$*+?\\]/.test(prefix);

      // Create the appropriate regex
      const prefixRegex = isRegexPattern
        ? new RegExp(prefix) // Use the pattern as-is
        : new RegExp(`^${prefix}.*$`); // Simple prefix matching

      Object.entries(process.env).reduce((acc, [key, value]) => {
        if (shouldProcess(key, prefixRegex)) {
          map.set(key, value);
        }
        return acc;
      }, map);

      resolve(map);
    } catch (error) {
      reject(error);
    }
  });
