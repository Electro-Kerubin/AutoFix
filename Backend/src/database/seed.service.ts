import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../clientes/cliente.entity';
import { Rol, TipoSucursal } from '../common/enums';
import { calcularDv } from '../common/utils/rut';
import { appConfig } from '../config/app.config';
import { CATALOGO_DEMO } from '../integraciones/catalogo-demo';
import { CatalogoFalla } from '../presupuestos/catalogo-falla.entity';
import { Repuesto } from '../repuestos/repuesto.entity';
import { StockSucursal } from '../repuestos/stock-sucursal.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Vehiculo } from '../vehiculos/vehiculo.entity';

/** Contraseña de las cuentas de demostración. Sólo para desarrollo: cambiarla o eliminarlas antes de producción. */
export const PASSWORD_DEMO = 'Autofix2026!';

const SUCURSALES = [
  { codigo: 'BODEGA', nombre: 'Bodega Central', tipo: TipoSucursal.BODEGA_CENTRAL, ciudad: 'Santiago', boxes: 1, piloto: false },
  { codigo: 'STGO', nombre: 'Santiago', tipo: TipoSucursal.TALLER, ciudad: 'Santiago', boxes: 6, piloto: true },
  { codigo: 'RGUA', nombre: 'Rancagua', tipo: TipoSucursal.TALLER, ciudad: 'Rancagua', boxes: 4, piloto: true },
  { codigo: 'VINA', nombre: 'Viña del Mar', tipo: TipoSucursal.TALLER, ciudad: 'Viña del Mar', boxes: 4, piloto: true },
];

const USUARIOS: { nombre: string; email: string; rol: Rol; sucursal?: string }[] = [
  { nombre: 'Administrador SUGO', email: 'admin@autofix.cl', rol: Rol.ADMIN },
  { nombre: 'Gerencia de Operaciones', email: 'gerencia@autofix.cl', rol: Rol.GERENCIA },
  { nombre: 'Bodeguero Central', email: 'bodega@autofix.cl', rol: Rol.BODEGA, sucursal: 'BODEGA' },
  { nombre: 'Jefe de Taller Santiago', email: 'jefe.stgo@autofix.cl', rol: Rol.JEFE_TALLER, sucursal: 'STGO' },
  { nombre: 'Recepción Santiago', email: 'recepcion.stgo@autofix.cl', rol: Rol.RECEPCION, sucursal: 'STGO' },
  { nombre: 'Mecánico Santiago', email: 'mecanico.stgo@autofix.cl', rol: Rol.MECANICO, sucursal: 'STGO' },
  { nombre: 'Jefe de Taller Rancagua', email: 'jefe.rgua@autofix.cl', rol: Rol.JEFE_TALLER, sucursal: 'RGUA' },
  { nombre: 'Recepción Rancagua', email: 'recepcion.rgua@autofix.cl', rol: Rol.RECEPCION, sucursal: 'RGUA' },
  { nombre: 'Mecánico Rancagua', email: 'mecanico.rgua@autofix.cl', rol: Rol.MECANICO, sucursal: 'RGUA' },
  { nombre: 'Jefe de Taller Viña', email: 'jefe.vina@autofix.cl', rol: Rol.JEFE_TALLER, sucursal: 'VINA' },
  { nombre: 'Recepción Viña', email: 'recepcion.vina@autofix.cl', rol: Rol.RECEPCION, sucursal: 'VINA' },
  { nombre: 'Mecánico Viña', email: 'mecanico.vina@autofix.cl', rol: Rol.MECANICO, sucursal: 'VINA' },
];

const FALLAS: [string, string, string][] = [
  ['FRE-01', 'Pastillas de freno desgastadas', 'Frenos'],
  ['FRE-02', 'Discos de freno rayados o alabeados', 'Frenos'],
  ['FRE-03', 'Fuga de líquido de frenos', 'Frenos'],
  ['MOT-01', 'Correa de distribución en mal estado', 'Motor'],
  ['MOT-02', 'Fuga de aceite de motor', 'Motor'],
  ['MOT-03', 'Bujías desgastadas / fallas de encendido', 'Motor'],
  ['SUS-01', 'Amortiguadores con fuga o sin respuesta', 'Suspensión'],
  ['SUS-02', 'Rótulas o terminales con juego', 'Suspensión'],
  ['ELE-01', 'Batería descargada o con celdas dañadas', 'Eléctrico'],
  ['ELE-02', 'Alternador sin carga', 'Eléctrico'],
  ['REF-01', 'Fuga de refrigerante', 'Refrigeración'],
  ['NEU-01', 'Neumáticos bajo el límite de desgaste', 'Neumáticos'],
];

const CLIENTES: { cuerpo: string; nombre: string; telefono: string; email: string }[] = [
  { cuerpo: '12456789', nombre: 'María González Soto', telefono: '+56911111111', email: 'maria.gonzalez@example.cl' },
  { cuerpo: '15234567', nombre: 'Juan Pérez Rojas', telefono: '+56922222222', email: 'juan.perez@example.cl' },
  { cuerpo: '9876543', nombre: 'Carolina Muñoz Vera', telefono: '+56933333333', email: 'carolina.munoz@example.cl' },
  { cuerpo: '17654321', nombre: 'Pedro Soto Alarcón', telefono: '+56944444444', email: 'pedro.soto@example.cl' },
];

const VEHICULOS: [string, string, string, number, number][] = [
  ['BCDF12', 'Toyota', 'Yaris', 2019, 68000],
  ['GHJK34', 'Chevrolet', 'Sail', 2021, 41000],
  ['LMNP56', 'Hyundai', 'Accent', 2017, 112000],
  ['RSTV78', 'Kia', 'Morning', 2020, 55000],
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    @InjectRepository(Sucursal) private readonly sucursales: Repository<Sucursal>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Cliente) private readonly clientes: Repository<Cliente>,
    @InjectRepository(Vehiculo) private readonly vehiculos: Repository<Vehiculo>,
    @InjectRepository(Repuesto) private readonly repuestos: Repository<Repuesto>,
    @InjectRepository(StockSucursal) private readonly stocks: Repository<StockSucursal>,
    @InjectRepository(CatalogoFalla) private readonly fallas: Repository<CatalogoFalla>,
    private readonly usuariosService: UsuariosService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.seedOnBoot) await this.sembrar();
  }

  /** Idempotente: si ya hay sucursales no toca nada. */
  async sembrar(): Promise<boolean> {
    if ((await this.sucursales.count()) > 0) return false;
    this.logger.log('Base de datos vacía: cargando datos de demostración…');

    const porCodigo = new Map<string, Sucursal>();
    for (const s of SUCURSALES) porCodigo.set(s.codigo, await this.sucursales.save(this.sucursales.create(s)));

    const passwordHash = await this.usuariosService.hash(PASSWORD_DEMO);
    await this.usuarios.save(
      USUARIOS.map((u) =>
        this.usuarios.create({
          nombre: u.nombre,
          email: u.email,
          rol: u.rol,
          sucursalId: u.sucursal ? porCodigo.get(u.sucursal)!.id : null,
          passwordHash,
        }),
      ),
    );

    await this.fallas.save(FALLAS.map(([codigo, nombre, categoria]) => this.fallas.create({ codigo, nombre, categoria })));

    for (const item of CATALOGO_DEMO) {
      const repuesto = await this.repuestos.save(
        this.repuestos.create({ codigo: item.codigo, nombre: item.nombre, categoria: item.categoria, precioVenta: item.precio, sincronizadoAt: new Date() }),
      );
      await this.stocks.save(
        item.stock.map((s) =>
          this.stocks.create({
            repuestoId: repuesto.id,
            sucursalId: porCodigo.get(s.sucursalCodigo)!.id,
            cantidad: s.cantidad,
            stockMinimo: s.minimo ?? 0,
            ubicacion: s.ubicacion ?? null,
          }),
        ),
      );
    }

    const clientes = await this.clientes.save(
      CLIENTES.map((c) =>
        this.clientes.create({ rut: `${c.cuerpo}-${calcularDv(c.cuerpo)}`, nombre: c.nombre, telefono: c.telefono, email: c.email }),
      ),
    );
    await this.vehiculos.save(
      VEHICULOS.map(([patente, marca, modelo, anio, kilometraje], i) =>
        this.vehiculos.create({ patente, marca, modelo, anio, kilometraje, clienteId: clientes[i].id }),
      ),
    );

    this.logger.warn(`Cuentas de demostración creadas (clave: ${PASSWORD_DEMO}). No usar en producción.`);
    return true;
  }
}
