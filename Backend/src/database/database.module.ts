import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { appConfig } from '../config/app.config';
@Module({imports:[TypeOrmModule.forRootAsync({inject:[appConfig.KEY],useFactory:(config:ConfigType<typeof appConfig>)=>({type:'postgres',host:config.db.host,port:config.db.port,username:config.db.user,password:config.db.password,database:config.db.name,ssl:config.db.ssl?{rejectUnauthorized:false}:false,autoLoadEntities:true,entities:[join(__dirname,'..','**','*.entity.js')],synchronize:config.db.synchronize,migrations:[join(__dirname,'migrations','*.{js,ts}')],migrationsRun:config.db.migrationsRun,logging:['error','warn']})})]})
export class DatabaseModule {}