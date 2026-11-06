import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from './api';
@Component({selector:'app-root',imports:[FormsModule,RouterLink,RouterLinkActive,RouterOutlet],templateUrl:'./app.html'})
export class App {
 readonly api=inject(Api);email='';password='';readonly error=signal('');readonly busy=signal(false);readonly menu=signal(false);
 readonly nav=[{path:'/',label:'Seguimiento del proyecto',icon:'◫'},{path:'/proyectos',label:'Proyectos',icon:'▤'},{path:'/planificacion',label:'Actividades y dependencias',icon:'⇄'},{path:'/gantt',label:'Carta Gantt',icon:'▦'},{path:'/recursos',label:'Recursos y costos',icon:'♙'},{path:'/hitos',label:'Hitos',icon:'⚑'},{path:'/kpi',label:'Administrador KPI',icon:'▥'},{path:'/cambios',label:'Solicitudes de cambio',icon:'⟳'},{path:'/tablero-cambios',label:'Tablero de cambios',icon:'◈'},{path:'/riesgos',label:'Riesgos',icon:'△'},{path:'/contexto',label:'Contexto y alcance',icon:'◎'},{path:'/trazabilidad',label:'Trazabilidad',icon:'≡'}];
 constructor(){void this.api.restore().then(()=>{if(this.api.usuario()&&!this.api.can('USUARIO_PROYECTO'))this.api.logout();});}
 async login(){this.busy.set(true);this.error.set('');try{await this.api.login(this.email,this.password);if(!this.api.can('USUARIO_PROYECTO')){this.api.logout();throw new Error('Esta cuenta no tiene acceso al gestor de proyectos.');}this.password='';}catch(e){this.error.set((e as Error).message);}finally{this.busy.set(false);}}
}