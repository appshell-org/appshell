/* eslint-disable class-methods-use-this */
import { AppshellManifest } from '@appshell/config';
import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { join } from 'path';
import { ConfigKeys } from './config';
import { HostService } from './host.service';

@Controller()
export class HostController {
  private readonly logger = new Logger(HostController.name);

  private readonly favIcon: string;

  private readonly title: string;

  private readonly description: string;

  private readonly publicUrl: string;

  private readonly themeColor: string;

  private readonly stylesheetUrl: string;

  constructor(
    private readonly hostService: HostService,
    private readonly configService: ConfigService,
  ) {
    this.favIcon = this.configService.get<string>(ConfigKeys.favIcon);
    this.title = this.configService.get<string>(ConfigKeys.title);
    this.description = this.configService.get<string>(ConfigKeys.description);
    this.publicUrl = this.configService.get<string>(ConfigKeys.publicUrl);
    this.themeColor = this.configService.get<string>(ConfigKeys.themeColor);
    this.stylesheetUrl = this.configService.get<string>(
      ConfigKeys.stylesheetUrl,
    );
  }

  @Get('/api-key')
  getApiKey(@Res() res: Response) {
    res.json({ apiKey: process.env.APPSHELL_API_KEY });
  }

  @Get('/config')
  async getConfig() {
    return this.hostService.getConfig();
  }

  @Get('/snapshot')
  async getSnapshot() {
    return this.hostService.getSnapshot();
  }

  @Post('/register')
  async register(@Body() manifest: AppshellManifest) {
    this.logger.log(`/register`);
    this.logger.debug(JSON.stringify(manifest, null, 2));
    this.logger.debug(`registry=${process.env.APPSHELL_REGISTRY}`);
    return this.hostService.register(manifest);
  }

  @Post('/deregister')
  async deregister(@Body() { moduleName }: { moduleName: string }) {
    this.logger.log(`/deregister`);
    this.logger.debug(`moduleName=${moduleName}`);
    return this.hostService.deregister(moduleName);
  }

  @Post('/generate/config')
  async generateConfig(
    @Body()
    {
      registries,
      options,
    }: {
      registries: string[];
      options: { insecure: boolean };
    },
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log(JSON.stringify(headers, null, 2));
    const apiKey = headers['x-api-key'];
    this.logger.log(`/generate/config`);
    this.logger.debug(JSON.stringify({ registries, options, apiKey }, null, 2));

    return this.hostService.generateConfig(registries, options, apiKey);
  }

  @Post('/generate/manifest')
  generateManifest() {
    return { generateManifest: 'generateManifest' };
  }

  @Post('/generate/env')
  generateEnv() {
    return { generateEnv: 'generateEnv' };
  }

  @Get('/appshell.config.json')
  async getAppshellConfig(@Res() res: Response) {
    const config = await this.hostService.getConfig();
    res.json(config);
  }

  @Get('/appshell.snapshot.json')
  async getAppshellSnapshot(@Res() res: Response) {
    const config = await this.hostService.getSnapshot();
    res.json(config);
  }

  @Get('*')
  renderIndex(@Res() res: Response) {
    res.render('index', {
      favIcon: this.favIcon,
      title: this.title,
      description: this.description,
      publicUrl: join(this.publicUrl || '', '/'),
      themeColor: this.themeColor,
      stylesheetUrl: this.stylesheetUrl,
    });
  }
}
