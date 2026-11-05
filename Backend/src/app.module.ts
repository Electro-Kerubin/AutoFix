import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard, RolesGuard } from './common/auth';
import { PostgresExceptionFilter } from './common/postgres-exception.filter';
import { ClientesModule } from './clientes/clientes.module';
import { appConfig } from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { GarantiasModule } from './garantias/garantias.module';
import { HealthController } from './health/health.controller';
import { IntegracionesModule } from './integraciones/integraciones.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { OrdenesTrabajoModule } from './ordenes-trabajo/ordenes-trabajo.module';
import { PortalModule } from './portal/portal.module';
import { PresupuestosModule } from './presupuestos/presupuestos.module';
import { ReportesModule } from './reportes/reportes.module';
import { RepuestosModule } from './repuestos/repuestos.module';
import { ReservasModule } from './reservas/reservas.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig], envFilePath: ['.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,

    // Monolito: el mismo proceso sirve el build de Angular (si existe) y la API bajo /api.
    ServeStaticModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) =>
        existsSync(join(config.frontendDist, 'index.html'))
          ? [{ rootPath: config.frontendDist, exclude: ['/api{/*splat}'] }]
          : [],
    }),

    AuthModule,
    UsuariosModule,
    SucursalesModule,
    ClientesModule,
    VehiculosModule,
    ReservasModule,
    OrdenesTrabajoModule,
    PresupuestosModule,
    RepuestosModule,
    GarantiasModule,
    NotificacionesModule,
    IntegracionesModule,
    PortalModule,
    ReportesModule,
  ],
  controllers: [HealthController],
  providers: [
    // El orden importa: límite de tasa → autenticación → autorización por rol.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: PostgresExceptionFilter },
  ],
})
export class AppModule {}
