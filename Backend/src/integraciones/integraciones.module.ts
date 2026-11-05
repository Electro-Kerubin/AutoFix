import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { appConfig } from '../config/app.config';
import { ErpClient, HttpErpClient, HttpInventarioClient, InventarioClient, MockErpClient } from './clientes-externos';
import { IntegracionesController } from './integraciones.controller';
import { MockInventarioClient } from './mock-inventario.client';
import { SyncJob } from './sync-job.entity';
import { SyncService } from './sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([SyncJob])],
  controllers: [IntegracionesController],
  providers: [
    SyncService,
    {
      provide: ErpClient,
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) =>
        config.erp.baseUrl ? new HttpErpClient(config.erp.baseUrl, config.erp.apiKey) : new MockErpClient(),
    },
    {
      provide: InventarioClient,
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) =>
        config.inventario.baseUrl
          ? new HttpInventarioClient(config.inventario.baseUrl, config.inventario.apiKey)
          : new MockInventarioClient(),
    },
  ],
  exports: [SyncService, InventarioClient, TypeOrmModule],
})
export class IntegracionesModule {}
