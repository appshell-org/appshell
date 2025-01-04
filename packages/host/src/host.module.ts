import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import configFactory from './config';
import { HostMonitorService } from './host-monitor.service';
import { HostController } from './host.controller';
import { HostService } from './host.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configFactory] }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [HostController],
  providers: [HostService, HostMonitorService],
})
export class HostModule {}
