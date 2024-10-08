import chalk from 'chalk';
import { cloneDeep, set } from 'lodash';
import { AppshellManifestValidator, AppshellTemplateValidator } from '../src/validators';
import appshellConfigRemoteCollisions from './assets/appshell.config-remote-collision.json';
import validManifest from './assets/appshell.json';
import appshellManifestRemoteCollisions from './assets/appshell.manifest-remote-collision.json';
import validAppshellConfig from './assets/appshell_configs/BarModule-Bar.json';
import bizAppshellConfig from './assets/appshell_configs/BizModule-Biz.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfig = any;

describe('validators', () => {
  let consoleSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log');
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('AppshellTemplateValidator', () => {
    it('should pass a valid appshell config template', () => {
      AppshellTemplateValidator.validate(validAppshellConfig);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should throw if multiple remotes with the same ID', () => {
      AppshellTemplateValidator.validate<AnyConfig>(bizAppshellConfig, bizAppshellConfig);

      expect(consoleSpy).toHaveBeenCalledWith(chalk.yellow('Multiple remotes with the same ID'));
    });

    it('should throw if multiple remotes with the same key', () => {
      AppshellTemplateValidator.validate<AnyConfig>(
        bizAppshellConfig,
        appshellConfigRemoteCollisions,
      );

      expect(consoleSpy).toHaveBeenCalledWith(chalk.yellow('Multiple remotes with the same key'));
    });
  });

  describe('AppshellManifestValidator', () => {
    it('should pass a valid appshell manifest', () => {
      AppshellManifestValidator.validate(validManifest);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should throw if multiple remotes with the same ID', () => {
      AppshellManifestValidator.validate<AnyConfig>(validManifest, validManifest);

      expect(consoleSpy).toHaveBeenCalledWith(chalk.yellow('Multiple remotes with the same ID'));
    });

    it('should throw if multiple remotes with the same key', () => {
      AppshellManifestValidator.validate<AnyConfig>(
        validManifest,
        appshellManifestRemoteCollisions,
      );

      expect(consoleSpy).toHaveBeenCalledWith(chalk.yellow('Multiple remotes with the same key'));
    });

    describe('hasSharedDependencyConflict', () => {
      it('should not warn if does not have shared dependency conflict', () => {
        const incomingManifest = cloneDeep(validManifest);

        set(incomingManifest, 'remotes', {});
        AppshellManifestValidator.validate<AnyConfig>(validManifest, incomingManifest);

        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency package1@0.1.0 satisfied in module TestModule. Module TestModule expects package1@0.1.0',
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency package2@1.1.0 satisfied in module TestModule. Module TestModule expects package2@1.1.0',
          ),
        );
      });

      it('should log if incoming manifest has new dependency', () => {
        const incomingManifest = cloneDeep(validManifest);

        set(incomingManifest, 'remotes', {});
        set(incomingManifest, 'modules.TestModule.shared.package3', {
          singleton: true,
          requiredVersion: '1.0.0',
        });

        AppshellManifestValidator.validate<AnyConfig>(validManifest, incomingManifest);

        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency package1@0.1.0 satisfied in module TestModule. Module TestModule expects package1@0.1.0',
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency package2@1.1.0 satisfied in module TestModule. Module TestModule expects package2@1.1.0',
          ),
        );
      });

      it('should log matches if incoming manifest has shared dependency that is in range', () => {
        const incomingManifest = cloneDeep(validManifest);

        set(incomingManifest, 'remotes', {});
        set(validManifest, 'modules.TestModule.shared.package2', {
          singleton: true,
          requiredVersion: '^1.0.0',
        });
        set(incomingManifest, 'modules.TestModule.shared.package2', {
          singleton: true,
          requiredVersion: '1.1.0',
        });

        AppshellManifestValidator.validate<AnyConfig>(validManifest, incomingManifest);

        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency package1@0.1.0 satisfied in module TestModule. Module TestModule expects package1@0.1.0',
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency package2@1.1.0 satisfied in module TestModule. Module TestModule expects package2@^1.0.0',
          ),
        );
      });

      it('should log conflict if incoming manifest has shared dependency that is out of range', () => {
        const incomingManifest = cloneDeep(validManifest);

        set(incomingManifest, 'remotes', {});
        set(validManifest, 'modules.TestModule.shared.package2', {
          singleton: true,
          requiredVersion: '^1.0.0',
        });
        set(incomingManifest, 'modules.TestModule.shared.package2', {
          singleton: true,
          requiredVersion: '2.0.0',
        });

        AppshellManifestValidator.validate<AnyConfig>(validManifest, incomingManifest);

        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.red(
            '\u2717 Shared dependency package2@2.0.0 conflicts in module TestModule. Module TestModule expects package2@^1.0.0',
          ),
        );
      });

      it('should log missing version if incoming manifest has shared dependency that is undefined', () => {
        const incomingManifest = cloneDeep(validManifest);

        set(incomingManifest, 'remotes', {});
        set(validManifest, 'modules.TestModule.shared.package2', {
          singleton: true,
          requiredVersion: '^1.0.0',
        });
        set(incomingManifest, 'modules.TestModule.shared.package2', {
          singleton: true,
          requiredVersion: undefined,
        });

        AppshellManifestValidator.validate<AnyConfig>(validManifest, incomingManifest);

        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.yellow(
            '\u26A0 Shared dependency package2@^1.0.0 missing in module TestModule. Module TestModule expects package2@^1.0.0',
          ),
        );
      });

      it('should log matches when shared dependencies are identical', () => {
        const incomingManifest = cloneDeep(validManifest);
        const shared = {
          react: {
            singleton: true,
            requiredVersion: '18.2.0',
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '18.2.0',
          },
          'react-refresh': {
            singleton: true,
            requiredVersion: '^0.14.0',
          },
          'styled-components': {
            singleton: true,
            requiredVersion: '6.0.0-rc.3',
          },
          '@appshell/react': {
            singleton: true,
            requiredVersion: '^0.3.0',
          },
        };

        set(incomingManifest, 'remotes', {});
        set(validManifest, 'modules.TestModule.shared', shared);
        set(incomingManifest, 'modules.TestModule.shared', shared);

        AppshellManifestValidator.validate<AnyConfig>(validManifest, incomingManifest);

        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency react@18.2.0 satisfied in module TestModule. Module TestModule expects react@18.2.0',
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency react-dom@18.2.0 satisfied in module TestModule. Module TestModule expects react-dom@18.2.0',
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency react-refresh@^0.14.0 satisfied in module TestModule. Module TestModule expects react-refresh@^0.14.0',
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency styled-components@6.0.0-rc.3 satisfied in module TestModule. Module TestModule expects styled-components@6.0.0-rc.3',
          ),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          chalk.green(
            '\u2714 Shared dependency @appshell/react@^0.3.0 satisfied in module TestModule. Module TestModule expects @appshell/react@^0.3.0',
          ),
        );
      });
    });
  });
});
