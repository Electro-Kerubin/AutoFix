import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard, RolesGuard } from './common/auth';
import { PostgresExceptionFilter } from './common/postgres-exception.filter';
import { appConfig } from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { UsuariosModule } from './usuarios/usuarios.module';
import { GestionModule } from './gestion/gestion.module';
@Module({imports:[ConfigModule.forRoot({isGlobal:true,load:[appConfig],envFilePath:['.env']}),ThrottlerModule.forRoot([{ttl:60000,limit:300}]),DatabaseModule,ServeStaticModule.forRootAsync({inject:[appConfig.KEY],useFactory:(config:ConfigType<typeof appConfig>)=>existsSync(join(config.frontendDist,'index.html'))?[{rootPath:config.frontendDist,exclude:['/api{/*splat}']}]:[]}),AuthModule,UsuariosModule,GestionModule],controllers:[HealthController],providers:[{provide:APP_GUARD,useClass:ThrottlerGuard},{provide:APP_GUARD,useClass:JwtAuthGuard},{provide:APP_GUARD,useClass:RolesGuard},{provide:APP_FILTER,useClass:PostgresExceptionFilter}]})
export class AppModule {}