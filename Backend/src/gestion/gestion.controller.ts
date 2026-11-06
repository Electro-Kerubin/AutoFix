import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { CurrentUser, Roles, UsuarioAutenticado } from '../common/auth';
import { Rol } from '../common/enums';
import { Command } from './model';
import { GestionService } from './gestion.service';
class CommandDto implements Command { @IsInt() @Min(1) version:number; @IsString() type:string; @IsIn(['create','update','delete']) action:'create'|'update'|'delete'; @IsOptional() @IsString() id?:string; @IsObject() data:Record<string,unknown>; }
@Controller('gestion/proyectos')
@Roles(Rol.ADMIN,Rol.USUARIO_PROYECTO)
export class GestionController {
 constructor(private readonly gestion:GestionService){}
 @Get() list(){return this.gestion.list();}
 @Post() @Roles(Rol.ADMIN) create(@Body() body:Record<string,unknown>,@CurrentUser() user:UsuarioAutenticado){return this.gestion.create(body,user);}
 @Get(':id') get(@Param('id',ParseUUIDPipe)id:string,@Query('fecha')date?:string){return this.gestion.get(id,date);}
 @Delete(':id') @Roles(Rol.ADMIN) remove(@Param('id',ParseUUIDPipe)id:string){return this.gestion.remove(id);}
 @Post(':id/comandos') command(@Param('id',ParseUUIDPipe)id:string,@Body()body:CommandDto,@CurrentUser()user:UsuarioAutenticado){return this.gestion.command(id,body,user);}
}