import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { ManagedProject } from './project.entity';
import { GestionController } from './gestion.controller';
import { GestionService } from './gestion.service';
@Module({imports:[TypeOrmModule.forFeature([ManagedProject,Usuario])],controllers:[GestionController],providers:[GestionService]})
export class GestionModule {}