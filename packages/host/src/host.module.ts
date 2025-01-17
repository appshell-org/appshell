import { generateEnv } from '@appshell/config';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import fs from 'fs';
import path, { join } from 'path';
import configFactory, { ConfigKeys } from './config';
import { HostMonitorService } from './host-monitor.service';
import { HostController } from './host.controller';
import { HostService } from './host.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configFactory] }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'shell'),
      serveRoot: '/shell',
    }),
  ],
  controllers: [HostController],
  providers: [HostService, HostMonitorService],
})
export class HostModule implements OnModuleInit {
  private readonly logger = new Logger(HostModule.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing HostModule...');
    const envPath = this.configService.get<string>(ConfigKeys.envPath);
    const prefix = this.configService.get<string>(ConfigKeys.envPrefix);
    const globalName = this.configService.get<string>(ConfigKeys.envGlobalVar);

    const env = await generateEnv(envPath, prefix);
    await this.writeEnvFile('shell', 'appshell.env.js', globalName, env);

    this.logger.log('HostModule has been initialized.');
  }

  private async writeEnvFile(
    outDir: string,
    outFile: string,
    globalName: string,
    env: Map<string, string>,
  ): Promise<void> {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    return new Promise<void>((resolve) => {
      const outputFile = fs.createWriteStream(path.join(outDir, outFile));

      outputFile.write(`window.${globalName} = {\n`);

      env.forEach((value, key) => {
        let formattedValue: string | number = parseFloat(value);
        if (Number.isNaN(formattedValue)) {
          formattedValue = `'${value.replaceAll("'", '')}'`;
        }
        outputFile.write(`\t${key}: ${formattedValue},\n`);
      });

      outputFile.end('}', resolve);
    });
  }
}
