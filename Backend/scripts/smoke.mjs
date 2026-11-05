const BASE = process.env.BASE ?? 'http://localhost:3000/api';
let fallos = 0;

async function http(method, ruta, { token, body, headers } = {}) {
  const res = await fetch(BASE + ruta, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  let data; try { data = texto ? JSON.parse(texto) : null; } catch { data = texto; }
  return { status: res.status, data };
}
function check(nombre, cond, extra) {
  if (cond) console.log(`  ok   ${nombre}`);
  else { fallos++; console.log(`  FAIL ${nombre}`, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); }
}
async function login(email) {
  const r = await http('POST', '/auth/login', { body: { email, password: 'Autofix2026!' } });
  if (r.status !== 200) throw new Error(`login ${email}: ${r.status} ${JSON.stringify(r.data)}`);
  return r.data.accessToken;
}

console.log('# Auth');
const recep = await login('recepcion.stgo@autofix.cl');
const jefe = await login('jefe.stgo@autofix.cl');
const mec = await login('mecanico.stgo@autofix.cl');
const bodega = await login('bodega@autofix.cl');
const admin = await login('admin@autofix.cl');
check('login inválido -> 401', (await http('POST', '/auth/login', { body: { email: 'admin@autofix.cl', password: 'mala' } })).status === 401);
check('sin token -> 401', (await http('GET', '/clientes')).status === 401);
check('mecánico no puede crear clientes -> 403', (await http('POST', '/clientes', { token: mec, body: { rut: '11111111-1', nombre: 'X' } })).status === 403);

console.log('# Sucursales y datos base');
const sucs = (await http('GET', '/sucursales', { token: recep })).data;
const stgo = sucs.find((s) => s.codigo === 'STGO');
check('3 talleres piloto + bodega', sucs.length === 4 && sucs.filter((s) => s.piloto).length === 3, sucs.map((s) => s.codigo));
const clientes = (await http('GET', '/clientes', { token: recep })).data;
check('clientes demo', clientes.total === 4, clientes.total);
const maria = clientes.items.find((c) => c.nombre.startsWith('María'));
const veh = (await http('GET', `/vehiculos?clienteId=${maria.id}`, { token: recep })).data.items[0];
check('vehículo de María (BCDF12)', veh?.patente === 'BCDF12', veh);

console.log('# Cliente / vehículo: validaciones');
check('RUT inválido -> 400', (await http('POST', '/clientes', { token: recep, body: { rut: '12345678-9', nombre: 'Test Inválido' } })).status === 400);
const dupe = await http('POST', '/clientes', { token: recep, body: { rut: maria.rut.replace('-', '.'), nombre: 'Otra María' } });
check('RUT duplicado -> 409', dupe.status === 409, dupe);
check('patente inválida -> 400', (await http('POST', '/vehiculos', { token: recep, body: { patente: 'XX', marca: 'a', modelo: 'b', clienteId: maria.id } })).status === 400);

console.log('# Agenda');
const manana = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10);
const disp = (await http('GET', `/reservas/disponibilidad?sucursalId=${stgo.id}&fecha=${manana}`, { token: recep })).data;
check('slots generados (08:30-18:00, 60min)', Array.isArray(disp) && disp.length === 9, disp?.length);
const slot = disp[2];
const reservaBody = { sucursalId: stgo.id, clienteId: maria.id, vehiculoId: veh.id, inicio: slot.inicio, canal: 'WHATSAPP', motivo: 'Mantención de 60.000 km' };
const r1 = await http('POST', '/reservas', { token: recep, body: reservaBody });
check('crear reserva -> 201', r1.status === 201, r1);
const r2 = await http('POST', '/reservas', { token: recep, body: reservaBody });
check('reserva duplicada del vehículo -> 409', r2.status === 409, r2);
const otro = (await http('GET', '/vehiculos?q=GHJK34', { token: recep })).data.items[0];
// llenar el cupo de la sucursal: boxes=6 -> ya hay 1; creamos con otros vehículos hasta agotar
const extra = [];
for (let i = 0; i < 6; i++) {
  const cli = (await http('POST', '/clientes', { token: recep, body: { rut: `${20000000 + i}-${dv(String(20000000 + i))}`, nombre: `Cliente Carga ${i}` } })).data;
  const v = (await http('POST', '/vehiculos', { token: recep, body: { patente: `ZZ${String(1000 + i)}`, marca: 'Test', modelo: 'Carga', clienteId: cli.id } })).data;
  extra.push((await http('POST', '/reservas', { token: recep, body: { ...reservaBody, clienteId: cli.id, vehiculoId: v.id } })).status);
}
check('cupo agotado: 5 ok y luego 409 (boxes=6)', extra.filter((s) => s === 201).length === 5 && extra[5] === 409, extra);
check('reserva en el pasado -> 400', (await http('POST', '/reservas', { token: recep, body: { ...reservaBody, vehiculoId: otro.id, clienteId: otro.clienteId, inicio: '2020-01-01T10:00:00-03:00' } })).status === 400);
check('fuera de horario -> 400', (await http('POST', '/reservas', { token: recep, body: { ...reservaBody, vehiculoId: otro.id, clienteId: otro.clienteId, inicio: `${manana}T23:00:00-03:00` } })).status === 400);

console.log('# Orden de trabajo');
const ot0 = await http('POST', '/ordenes-trabajo', { token: recep, body: { sucursalId: stgo.id, clienteId: maria.id, vehiculoId: veh.id, reservaId: r1.data.id, motivoIngreso: 'Mantención 60.000 km + ruido en frenos', kilometraje: 68500 } });
check('crear OT -> 201', ot0.status === 201, ot0);
const ot = ot0.data.orden;
check('número legible OT-AAAA-000001', /^OT-\d{4}-\d{6}$/.test(ot.numero), ot.numero);
check('km menor al registrado -> 400', (await http('POST', '/ordenes-trabajo', { token: recep, body: { sucursalId: stgo.id, clienteId: maria.id, vehiculoId: veh.id, motivoIngreso: 'x x x', kilometraje: 10 } })).status === 400);
check('2ª OT abierta del mismo vehículo -> 409', (await http('POST', '/ordenes-trabajo', { token: recep, body: { sucursalId: stgo.id, clienteId: maria.id, vehiculoId: veh.id, motivoIngreso: 'otra vez', kilometraje: 68600 } })).status === 409);
const reservaDespues = (await http('GET', `/reservas/${r1.data.id}`, { token: recep })).data;
check('reserva pasó a ASISTIO', reservaDespues.estado === 'ASISTIO', reservaDespues.estado);

console.log('# Presupuesto, aprobación y portal');
const est = (id, estado, token = jefe, comentario) => http('POST', `/ordenes-trabajo/${id}/estado`, { token, body: { estado, comentario } });
check('RECEPCIONADA -> EN_REPARACION inválido -> 409', (await est(ot.id, 'EN_REPARACION')).status === 409);
check('-> EN_DIAGNOSTICO ok', (await est(ot.id, 'EN_DIAGNOSTICO')).status === 200);
const fallas = (await http('GET', '/catalogo-fallas', { token: jefe })).data;
const repuestos = (await http('GET', '/repuestos?limit=100', { token: jefe })).data.items;
const pastillas = repuestos.find((r) => r.codigo === 'FRE-PAS-DEL');
const pres = await http('POST', `/ordenes-trabajo/${ot.id}/presupuestos`, {
  token: jefe,
  body: {
    notas: 'Cambio de pastillas y mantención',
    items: [
      { tipo: 'MANO_OBRA', descripcion: 'Mantención 60.000 km', cantidad: 1, precioUnitario: 85000, garantiaMeses: 3 },
      { tipo: 'REPUESTO', repuestoId: pastillas.id, cantidad: 1, catalogoFallaId: fallas.find((f) => f.codigo === 'FRE-01').id, garantiaMeses: 12 },
    ],
  },
});
check('crear presupuesto -> 201 con total calculado en servidor', pres.status === 201 && pres.data.total === 85000 + pastillas.precioVenta, pres.data);
const pid = pres.data.id;
check('segundo borrador simultáneo -> 409', (await http('POST', `/ordenes-trabajo/${ot.id}/presupuestos`, { token: jefe, body: { items: [{ tipo: 'MANO_OBRA', descripcion: 'x x x', cantidad: 1, precioUnitario: 1 }] } })).status === 409);
check('enviar presupuesto', (await http('POST', `/presupuestos/${pid}/enviar`, { token: jefe })).status === 200);
check('no se puede editar un presupuesto enviado -> 409', (await http('PATCH', `/presupuestos/${pid}`, { token: jefe, body: { items: [{ tipo: 'MANO_OBRA', descripcion: 'cambio', cantidad: 1, precioUnitario: 1 }] } })).status === 409);
const otEnv = (await http('GET', `/ordenes-trabajo/${ot.id}`, { token: jefe })).data;
check('OT quedó en PRESUPUESTO_PENDIENTE', otEnv.estado === 'PRESUPUESTO_PENDIENTE', otEnv.estado);

const link = (await http('GET', `/ordenes-trabajo/${ot.id}/link-portal`, { token: recep })).data.url;
const tokenPortal = link.split('/').pop();
const portal = await http('GET', `/portal/${tokenPortal}`);
check('portal sin sesión -> 200', portal.status === 200, portal);
check('portal no filtra RUT ni contacto', !JSON.stringify(portal.data).includes(maria.rut) && !JSON.stringify(portal.data).includes('+569'), Object.keys(portal.data));
check('portal muestra presupuesto con puedeDecidir', portal.data.presupuestos[0]?.puedeDecidir === true);
check('token inexistente -> 404', (await http('GET', `/portal/${'a'.repeat(48)}`)).status === 404);
check('token mal formado -> 404', (await http('GET', '/portal/hola')).status === 404);
const ap = await http('POST', `/portal/${tokenPortal}/presupuestos/${pid}/aprobar`, { body: { nombre: 'María González' }, headers: { 'User-Agent': 'smoke/1.0' } });
check('aprobar desde portal -> 200', ap.status === 200, ap);
check('aprobar dos veces -> 409', (await http('POST', `/portal/${tokenPortal}/presupuestos/${pid}/aprobar`, { body: {} })).status === 409);
const presAprob = (await http('GET', `/presupuestos/${pid}`, { token: jefe })).data;
check('evidencia de aprobación (fecha, canal, IP, hash)', presAprob.estado === 'APROBADO' && presAprob.decisionCanal === 'PORTAL' && presAprob.decididoAt && /^[a-f0-9]{64}$/.test(presAprob.decisionHash) && presAprob.decisionIp, presAprob);
const otRep = (await http('GET', `/ordenes-trabajo/${ot.id}`, { token: jefe })).data;
check('OT pasó sola a EN_REPARACION', otRep.estado === 'EN_REPARACION', otRep.estado);

console.log('# Repuestos y stock');
const stockAntes = (await http('GET', `/repuestos/${pastillas.id}`, { token: jefe })).data.stock.find((s) => s.sucursalId === stgo.id).cantidad;
const asign = await http('POST', `/ordenes-trabajo/${ot.id}/repuestos`, { token: mec, body: { repuestoId: pastillas.id, cantidad: 1, garantiaMeses: 12 } });
check('mecánico asigna repuesto -> 201', asign.status === 201, asign);
const stockDesp = (await http('GET', `/repuestos/${pastillas.id}`, { token: jefe })).data.stock.find((s) => s.sucursalId === stgo.id).cantidad;
check('stock descontado', stockDesp === stockAntes - 1, { stockAntes, stockDesp });
check('stock insuficiente -> 409', (await http('POST', `/ordenes-trabajo/${ot.id}/repuestos`, { token: mec, body: { repuestoId: pastillas.id, cantidad: 999 } })).status === 409);
check('LISTA_ENTREGA ok', (await est(ot.id, 'LISTA_ENTREGA')).status === 200);
check('entregar sin validar repuestos -> 409', (await est(ot.id, 'ENTREGADA', recep)).status === 409);
check('mecánico no puede validar repuestos -> 403', (await http('POST', `/ordenes-trabajo/${ot.id}/validar-repuestos`, { token: mec, body: {} })).status === 403);
check('validar repuestos (jefe)', (await http('POST', `/ordenes-trabajo/${ot.id}/validar-repuestos`, { token: jefe, body: {} })).status === 200);
check('mecánico no puede entregar -> 403', (await est(ot.id, 'ENTREGADA', mec)).status === 403);
const entrega = await est(ot.id, 'ENTREGADA', recep);
check('entregar OT -> 200', entrega.status === 200, entrega);
check('totalFinal = presupuesto aprobado', entrega.data.totalFinal === pres.data.total, entrega.data.totalFinal);
check('OT cerrada no admite repuestos -> 409', (await http('POST', `/ordenes-trabajo/${ot.id}/repuestos`, { token: mec, body: { repuestoId: pastillas.id, cantidad: 1 } })).status === 409);

console.log('# Garantías');
const hist = await http('GET', '/garantias/historial?q=bcdf-12', { token: recep });
check('historial por patente (con guion/minúsculas) -> 200', hist.status === 200, hist);
check('2 garantías vigentes (repuesto 12m + mano de obra 3m)', hist.data[0].garantiasVigentes.length === 2, hist.data[0].garantiasVigentes);
const histRut = await http('GET', `/garantias/historial?q=${encodeURIComponent(maria.rut)}`, { token: bodega });
check('historial por RUT desde otra sucursal -> 200', histRut.status === 200 && histRut.data[0].vehiculo.patente === 'BCDF12');
check('patente inexistente -> 404', (await http('GET', '/garantias/historial?q=AAAA11', { token: recep })).status === 404);

console.log('# Integraciones (outbox)');
const antes = (await http('GET', '/integraciones/sync', { token: admin })).data;
check('jobs en cola: OT_CERRADA + CONSUMO_REPUESTO', antes.some((j) => j.tipo === 'OT_CERRADA') && antes.some((j) => j.tipo === 'CONSUMO_REPUESTO'), antes.map((j) => [j.tipo, j.estado]));
const proc = await http('POST', '/integraciones/sync/procesar', { token: admin });
const despues = (await http('GET', '/integraciones/sync', { token: admin })).data;
check('jobs despachados (ENVIADO)', despues.every((j) => j.estado === 'ENVIADO'), despues.map((j) => [j.tipo, j.estado, j.ultimoError]));
check('no-admin no accede a integraciones -> 403', (await http('GET', '/integraciones/sync', { token: jefe })).status === 403);
check('sincronizar inventario con cola vacía -> 200', (await http('POST', '/repuestos/sincronizar', { token: bodega })).status === 200);

console.log('# Reportes');
const kpis = await http('GET', '/reportes/kpis', { token: jefe });
check('KPIs -> 200', kpis.status === 200 && kpis.data.ordenesTrabajo.entregadas === 1, kpis.data);
check('recepción no ve KPIs -> 403', (await http('GET', '/reportes/kpis', { token: recep })).status === 403);

console.log(fallos ? `\n${fallos} FALLO(S)` : '\nTODO OK');
process.exit(fallos ? 1 : 0);

function dv(cuerpo) {
  let s = 0, f = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) { s += Number(cuerpo[i]) * f; f = f === 7 ? 2 : f + 1; }
  const r = 11 - (s % 11);
  return r === 11 ? '0' : r === 10 ? 'K' : String(r);
}
