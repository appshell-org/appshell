import {
  AppshellManifest,
  deregister,
  generateGlobalConfig,
  register,
} from '@appshell/config';
import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';

@Injectable()
export class HostService {
  private readonly logger = new Logger(HostService.name);

  async getConfig() {
    const configPath = `${process.env.APPSHELL_REGISTRY}/appshell.config.json`;
    this.logger.log(`get config from ${configPath}`);
    if (!fs.existsSync(configPath)) {
      throw new Error(`config file not found at ${configPath}`);
    }
    const config = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(config);
  }

  async getSnapshot() {
    const snapshotPath = `${process.env.APPSHELL_REGISTRY}/appshell.snapshot.json`;
    this.logger.log(`get snapshot from ${snapshotPath}`);
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`snapshot not found at ${snapshotPath}`);
    }
    const snapshot = fs.readFileSync(snapshotPath, 'utf-8');
    return JSON.parse(snapshot);
  }

  // eslint-disable-next-line class-methods-use-this
  async register(manifest: AppshellManifest) {
    await register(manifest, process.env.APPSHELL_REGISTRY, true);
  }

  // eslint-disable-next-line class-methods-use-this
  async deregister(moduleName: string) {
    await deregister(moduleName, process.env.APPSHELL_REGISTRY);
  }

  async generateConfig(
    registries: string[],
    options: { insecure: boolean },
    apiKey?: string,
  ) {
    this.logger.log(
      `registries=${JSON.stringify(registries)}, apiKey=${!!apiKey}`,
    );
    return generateGlobalConfig(registries, { ...options, apiKey });
  }
}
