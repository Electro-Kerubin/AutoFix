import { Column, Entity } from 'typeorm';
import { EntidadBase } from '../common/base.entity';
import { ProjectData } from './model';
@Entity('gestion_proyectos')
export class ManagedProject extends EntidadBase {
 @Column({type:'varchar',length:40,unique:true}) code:string;
 @Column({type:'int',default:1}) version:number;
 @Column({type:'jsonb'}) data:ProjectData;
}