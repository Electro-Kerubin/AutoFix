import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, ILike, In, Not, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../common/auth';
import { SistemaExterno, TipoMovimientoStock, TipoSync } from '../common/enums';
import { pagina, saltar } from '../common/pagination';
import { InventarioClient } from '../integraciones/clientes-externos';
import { SyncService } from '../integraciones/sync.service';
import { bloquearOt, exigirAbierta } from '../ordenes-trabajo/ot-transiciones';
import { OrdenTrabajo } from '../ordenes-trabajo/orden-trabajo.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import {
  AjusteStockDto,
  AsignarRepuestoDto,
  BuscarRepuestosDto,
  CreateRepuestoDto,
  UpdateRepuestoDto,
} from './repuestos.dto';
import { MovimientoStock } from './movimiento-stock.entity';
import { OtRepuesto } from './ot-repuesto.entity';
import { Repuesto } from './repuesto.entity';
import { StockSucursal } from './stock-sucursal.entity';

@Injectable()
export class RepuestosService {
  private readonly logger = new Logger(RepuestosService.name);

  constructor(
    @InjectRepository(Repuesto) private readonly repo: Repository<Repuesto>,
    @InjectRepository(StockSucursal) private readonly stocks: Repository<StockSucursal>,
    @InjectRepository(OtRepuesto) private readonly otRepuestos: Repository<OtRepuesto>,
    @InjectRepository(Sucursal) private readonly sucursales: Repository<Sucursal>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly sync: SyncService,
    private readonly inventario: InventarioClient,
  ) {}

  // ---- Catálogo y stock ----

  async buscar(dto: BuscarRepuestosDto) {
    const termino = dto.q?.trim();
    const [items, total] = await this.repo.findAndCount({
      where: termino ? [{ nombre: ILike(`%${termino}%`) }, { codigo: ILike(`%${termino}%`) }] : {},
      order: { nombre: 'ASC' },
      skip: saltar(dto),
      take: dto.limit,
    });
    const stock = items.length
      ? await this.stocks.find({
          where: { repuestoId: In(items.map((r) => r.id)), ...(dto.sucursalId ? { sucursalId: dto.sucursalId } : {}) },
          relations: { sucursal: true },
        })
      : [];
    const conStock = items.map((r) => ({ ...r, stock: stock.filter((s) => s.repuestoId === r.id) }));
    return pagina(conStock, total, dto);
  }

  async obtener(id: string): Promise<Repuesto> {
    const repuesto = await this.repo.findOne({ where: { id }, relations: { stock: { sucursal: true } } });
    if (!repuesto) throw new NotFoundException('Repuesto no encontrado');
    return repuesto;
  }

  async crear(dto: CreateRepuestoDto): Promise<Repuesto> {
    if (await this.repo.existsBy({ codigo: dto.codigo })) {
      throw new ConflictException(`Ya existe un repuesto con código ${dto.codigo}`);
    }
    return this.repo.save(this.repo.create(dto));
  }

  async actualizar(id: string, dto: UpdateRepuestoDto): Promise<Repuesto> {
    await this.obtener(id);
    if (dto.codigo && (await this.repo.existsBy({ codigo: dto.codigo, id: Not(id) }))) {
      throw new ConflictException(`Ya existe un repuesto con código ${dto.codigo}`);
    }
    await this.repo.update(id, dto);
    return this.obtener(id);
  }

  /** Repuestos en o bajo su nivel mínimo: base para reponer antes de caer en compras urgentes. */
  alertasReposicion(sucursalId?: string): Promise<StockSucursal[]> {
    const qb = this.stocks
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.repuesto', 'repuesto')
      .innerJoinAndSelect('s.sucursal', 'sucursal')
      .where('s.stockMinimo > 0')
      .andWhere('s.cantidad <= s.stockMinimo')
      .orderBy('s.cantidad', 'ASC')
      .limit(200);
    if (sucursalId) qb.andWhere('s.sucursalId = :sucursalId', { sucursalId });
    return qb.getMany();
  }

  async ajustarStock(repuestoId: string, dto: AjusteStockDto, usuario: UsuarioAutenticado): Promise<StockSucursal> {
    await this.obtener(repuestoId);
    if (!(await this.sucursales.existsBy({ id: dto.sucursalId }))) throw new NotFoundException('Sucursal no encontrada');

    return this.dataSource.transaction(async (manager) => {
      const stock = await this.stockBloqueado(manager, repuestoId, dto.sucursalId, true);
      const delta = dto.cantidad - stock.cantidad;
      stock.cantidad = dto.cantidad;
      if (dto.stockMinimo !== undefined) stock.stockMinimo = dto.stockMinimo;
      if (dto.ubicacion !== undefined) stock.ubicacion = dto.ubicacion;
      await manager.save(stock);
      if (delta !== 0) {
        await this.movimiento(manager, stock, TipoMovimientoStock.AJUSTE, delta, null, dto.motivo, usuario.id);
      }
      return stock;
    });
  }

  // ---- Uso de repuestos en una OT (REQ-04) ----

  listarPorOt(otId: string): Promise<OtRepuesto[]> {
    return this.otRepuestos.find({
      where: { otId },
      relations: { repuesto: true, sucursalOrigen: true },
      order: { createdAt: 'ASC' },
    });
  }

  async asignarAOt(otId: string, dto: AsignarRepuestoDto, usuario: UsuarioAutenticado): Promise<OtRepuesto> {
    const id = await this.dataSource.transaction(async (manager) => {
      const ot = await bloquearOt(manager, otId);
      exigirAbierta(ot);

      const repuesto = await manager.findOneBy(Repuesto, { id: dto.repuestoId });
      if (!repuesto?.activo) throw new NotFoundException('Repuesto no encontrado o inactivo');
      const origenId = dto.sucursalOrigenId ?? ot.sucursalId;
      const origen = await manager.findOneBy(Sucursal, { id: origenId });
      if (!origen) throw new NotFoundException('Sucursal de origen no encontrada');

      const stock = await this.stockBloqueado(manager, repuesto.id, origenId, false);
      if (!stock || stock.cantidad < dto.cantidad) {
        throw new ConflictException(
          `Stock insuficiente de ${repuesto.codigo} en ${origen.nombre}: disponible ${stock?.cantidad ?? 0}, solicitado ${dto.cantidad}`,
        );
      }
      stock.cantidad -= dto.cantidad;
      await manager.save(stock);
      await this.movimiento(manager, stock, TipoMovimientoStock.SALIDA_OT, -dto.cantidad, ot.id, `Asignado a ${ot.numero}`, usuario.id);

      const asignado = await manager.save(
        manager.create(OtRepuesto, {
          otId,
          repuestoId: repuesto.id,
          sucursalOrigenId: origenId,
          cantidad: dto.cantidad,
          precioUnitario: dto.precioUnitario ?? repuesto.precioVenta,
          garantiaMeses: dto.garantiaMeses ?? 0,
          asignadoPorId: usuario.id,
        }),
      );
      await this.invalidarValidacion(manager, ot);
      await this.sync.encolar(manager, SistemaExterno.INVENTARIO, TipoSync.CONSUMO_REPUESTO, asignado.id, {
        otId: ot.id,
        otNumero: ot.numero,
        sucursalCodigo: origen.codigo,
        repuestoCodigo: repuesto.codigo,
        cantidad: dto.cantidad,
      });
      return asignado.id;
    });
    return this.otRepuestos.findOneOrFail({ where: { id }, relations: { repuesto: true, sucursalOrigen: true } });
  }

  async quitarDeOt(otId: string, otRepuestoId: string, usuario: UsuarioAutenticado): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const ot = await bloquearOt(manager, otId);
      exigirAbierta(ot);

      const asignado = await manager.findOne(OtRepuesto, {
        where: { id: otRepuestoId, otId },
        relations: { repuesto: true, sucursalOrigen: true },
      });
      if (!asignado) throw new NotFoundException('El repuesto no está asignado a esta OT');

      const stock = await this.stockBloqueado(manager, asignado.repuestoId, asignado.sucursalOrigenId, true);
      stock.cantidad += asignado.cantidad;
      await manager.save(stock);
      await this.movimiento(manager, stock, TipoMovimientoStock.REVERSA_OT, asignado.cantidad, ot.id, `Retirado de ${ot.numero}`, usuario.id);
      await manager.delete(OtRepuesto, { id: asignado.id });
      await this.invalidarValidacion(manager, ot);
      await this.sync.encolar(manager, SistemaExterno.INVENTARIO, TipoSync.REVERSA_CONSUMO, asignado.id, {
        otId: ot.id,
        otNumero: ot.numero,
        sucursalCodigo: asignado.sucursalOrigen.codigo,
        repuestoCodigo: asignado.repuesto.codigo,
        cantidad: -asignado.cantidad,
      });
    });
  }

  // ---- Sincronización con el sistema de inventarios (REQ-08) ----

  /**
   * Trae catálogo, precios, existencias y ubicaciones del inventario corporativo.
   * Se rechaza mientras queden consumos sin enviar: el inventario aún no los refleja y se pisaría el stock local.
   */
  async sincronizarDesdeInventario(usuario: UsuarioAutenticado) {
    const pendientes = await this.sync.pendientesInventario();
    if (pendientes > 0) {
      throw new ConflictException(
        `Hay ${pendientes} movimiento(s) de repuestos pendientes de enviar al inventario; procésalos antes de sincronizar`,
      );
    }
    const remotos = await this.inventario.listarStock();
    const sucursales = new Map((await this.sucursales.find()).map((s) => [s.codigo, s.id]));
    const ahora = new Date();
    let repuestos = 0;
    let existencias = 0;
    const omitidas = new Set<string>();

    await this.dataSource.transaction(async (manager) => {
      for (const item of remotos) {
        let repuesto = await manager.findOneBy(Repuesto, { codigo: item.codigo });
        repuesto = manager.merge(Repuesto, repuesto ?? manager.create(Repuesto, { codigo: item.codigo }), {
          nombre: item.nombre,
          categoria: item.categoria ?? null,
          precioVenta: item.precio,
          sincronizadoAt: ahora,
        });
        repuesto = await manager.save(repuesto);
        repuestos++;

        for (const fila of item.stock) {
          const sucursalId = sucursales.get(fila.sucursalCodigo);
          if (!sucursalId) {
            omitidas.add(fila.sucursalCodigo);
            continue;
          }
          const stock = await this.stockBloqueado(manager, repuesto.id, sucursalId, true);
          const delta = fila.cantidad - stock.cantidad;
          stock.cantidad = fila.cantidad;
          if (fila.minimo !== undefined) stock.stockMinimo = fila.minimo;
          if (fila.ubicacion !== undefined) stock.ubicacion = fila.ubicacion;
          await manager.save(stock);
          if (delta !== 0) {
            await this.movimiento(manager, stock, TipoMovimientoStock.SYNC_INVENTARIO, delta, null, 'Sincronización con inventario', usuario.id);
          }
          existencias++;
        }
      }
    });

    if (omitidas.size) this.logger.warn(`Sucursales desconocidas en el inventario (omitidas): ${[...omitidas].join(', ')}`);
    return { repuestos, existencias, sucursalesOmitidas: [...omitidas] };
  }

  // ---- Internos ----

  /** Devuelve la fila de stock bloqueada; con `crear` la inicializa en 0 si no existe. */
  private async stockBloqueado(manager: EntityManager, repuestoId: string, sucursalId: string, crear: true): Promise<StockSucursal>;
  private async stockBloqueado(manager: EntityManager, repuestoId: string, sucursalId: string, crear: false): Promise<StockSucursal | null>;
  private async stockBloqueado(manager: EntityManager, repuestoId: string, sucursalId: string, crear: boolean) {
    const existente = await manager.findOne(StockSucursal, {
      where: { repuestoId, sucursalId },
      lock: { mode: 'pessimistic_write' },
    });
    if (existente || !crear) return existente;
    await manager
      .createQueryBuilder()
      .insert()
      .into(StockSucursal)
      .values({ repuestoId, sucursalId, cantidad: 0, stockMinimo: 0 })
      .orIgnore()
      .execute();
    return manager.findOneOrFail(StockSucursal, { where: { repuestoId, sucursalId }, lock: { mode: 'pessimistic_write' } });
  }

  private movimiento(
    manager: EntityManager,
    stock: StockSucursal,
    tipo: TipoMovimientoStock,
    cantidad: number,
    otId: string | null,
    motivo: string,
    usuarioId: string,
  ) {
    return manager.insert(MovimientoStock, {
      repuestoId: stock.repuestoId,
      sucursalId: stock.sucursalId,
      tipo,
      cantidad,
      stockResultante: stock.cantidad,
      otId,
      motivo,
      usuarioId,
    });
  }

  /** Cualquier cambio de repuestos obliga a revalidar antes de entregar la OT. */
  private async invalidarValidacion(manager: EntityManager, ot: OrdenTrabajo): Promise<void> {
    if (!ot.repuestosValidadosAt) return;
    await manager.update(OrdenTrabajo, ot.id, { repuestosValidadosAt: null, repuestosValidadosPorId: null });
    ot.repuestosValidadosAt = null;
  }
}
