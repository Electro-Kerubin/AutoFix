import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { Cliente } from '../clientes/cliente.entity';
import { appConfig } from '../config/app.config';
import { CatalogoFalla } from '../presupuestos/catalogo-falla.entity';
import { Repuesto } from '../repuestos/repuesto.entity';
import { StockSucursal } from '../repuestos/stock-sucursal.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { Vehiculo } from '../vehiculos/vehiculo.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => ({
        type: 'postgres',
        host: config.db.host,
        port: config.db.port,
        username: config.db.user,
        password: config.db.password,
        database: config.db.name,
        ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: config.db.synchronize,
        migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
        migrationsRun: config.db.migrationsRun,
        logging: ['error', 'warn'],
      }),
    }),
    TypeOrmModule.forFeature([Sucursal, Usuario, Cliente, Vehiculo, Repuesto, StockSucursal, CatalogoFalla]),
    UsuariosModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
