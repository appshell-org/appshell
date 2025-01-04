import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import { isEmpty, isEqual } from 'lodash';
import { Subscription, asyncScheduler, interval, of, scheduled } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ConfigKeys } from './config';
import { HostService } from './host.service';

@Injectable()
export class HostMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HostMonitorService.name);

  private readonly monitorInterval: number;

  private readonly registryPath: string;

  private readonly baseRegistryUrls: string[];

  private readonly apiKey: string | undefined;

  private readonly verifySSL: boolean;

  private monitoringSubscription: Subscription;

  constructor(
    private readonly hostService: HostService,
    private readonly configService: ConfigService,
  ) {
    this.monitorInterval = this.configService.get<number>(
      ConfigKeys.monitorInterval,
    );
    this.registryPath = this.configService.get<string>(ConfigKeys.registryPath);
    this.baseRegistryUrls = this.configService.get<string[]>(
      ConfigKeys.baseRegistryUrls,
    );
    this.apiKey = this.configService.get<string>(ConfigKeys.apiKey);
  }

  onModuleInit() {
    if (isEmpty(this.baseRegistryUrls)) {
      this.logger.warn('No registries to monitor');
      return;
    }
    this.logger.log(
      `Monitoring registries [${this.baseRegistryUrls.join(',')}] started.`,
    );
    // Create an observable that emits every 5 seconds
    const monitoringObservable = interval(this.monitorInterval).pipe(
      switchMap(() => scheduled(this.generateConfig(), asyncScheduler)),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr)),
      catchError((error) => {
        this.logger.error(`Error generating config ${error.message}`);
        return of(error);
      }),
    );

    // Subscribe to the observable
    this.monitoringSubscription = monitoringObservable.subscribe((result) => {
      this.logger.log(`Config changed`);
      fs.writeFileSync(
        `${this.registryPath}/appshell.config.json`,
        JSON.stringify(result, null, 2),
        'utf-8',
      );
    });
  }

  onModuleDestroy() {
    // Unsubscribe from the observable when the module is destroyed
    if (this.monitoringSubscription) {
      this.logger.log(
        `Monitoring registries [${this.baseRegistryUrls.join(',')}] stopped`,
      );
      this.monitoringSubscription.unsubscribe();
    }
  }

  private async generateConfig() {
    return this.hostService.generateConfig(
      this.baseRegistryUrls.concat(this.registryPath),
      { insecure: !this.verifySSL },
      this.apiKey,
    );
  }
}
