# AutoFix · SUGO

## Todo el sistema con Docker

Con Docker Desktop iniciado, desde esta carpeta ejecuta:

```powershell
docker compose up -d --build
```

| Servicio | Dirección |
| --- | --- |
| Aplicación (Angular + proxy a la API) | http://localhost:4201 |
| API NestJS | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Salud, incluida la base de datos | http://localhost:4201/api/health |
| PostgreSQL | localhost:5432 |

Compose espera a que PostgreSQL esté disponible antes de iniciar el backend; el frontend (nginx) entrega la aplicación y reenvía `/api` al backend, por lo que el navegador usa un solo origen. Los archivos adjuntos se conservan en `Backend/uploads` y la base de datos en el volumen `autofix_pgdata`. Para detener los servicios, ejecuta `docker compose stop`; para reiniciar con datos de demostración limpios, `docker compose down -v` (borra la base).

La configuración opcional `Backend/.env` se carga en el backend. Para mantener las credenciales de ambos servicios sincronizadas, define `DB_USER`, `DB_PASSWORD` y `DB_NAME` en un archivo `.env` en la raíz del repositorio; Compose las aplica a ambos contenedores. Los puertos externos se cambian con `BACKEND_PORT`, `FRONTEND_PORT` y `DB_PORT`; si cambias `FRONTEND_PORT`, ajusta también `PUBLIC_URL`/`CORS_ORIGIN` del backend, porque los enlaces del portal cliente usan esa dirección. Esta configuración está orientada al desarrollo. Detén cualquier backend local que ya use el puerto 3000 antes de iniciarla; el script `Iniciar-AutoFix.ps1` inicia su propio backend local y no debe ejecutarse simultáneamente con los contenedores.

Frontend Angular conectado al backend NestJS y PostgreSQL del repositorio AutoFix. El diseño del ZIP de Figma se adaptó a la operación real de los talleres: ya no depende de React, Vite, datos simulados del panel ni la librería XLSX del prototipo.

## Ejecutar en Windows

Requisitos: Docker Desktop iniciado y npm disponible. Desde esta carpeta:

```powershell
.\Iniciar-AutoFix.ps1
```

El script instala las dependencias que falten, prepara un `.env` local si no existe, inicia PostgreSQL, compila NestJS y abre Angular. Utiliza Node 24.15 local en `.tools`; no modifica el Node global. No inicia servicios duplicados cuando sus puertos ya están ocupados.

- Aplicación: http://localhost:4201
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Salud, incluida la base de datos: http://localhost:4201/api/health
- Logs: `Backend/server.log`, `Backend/server-error.log`, `Frontend/server.log`, `Frontend/server-error.log`.

Abre `AutoFix.code-workspace` en Visual Studio Code. La tarea **AutoFix: Iniciar** ejecuta el mismo script.

## Cuentas del entorno local

Al iniciar una base vacía se cargan sucursales, usuarios, clientes, vehículos y repuestos de ejemplo. Contraseña de las cuentas de demostración: `Autofix2026!`.

| Cuenta                    | Uso                                                      |
| ------------------------- | -------------------------------------------------------- |
| admin@autofix.cl          | Todas las funciones e integraciones                      |
| usuario.proyecto@autofix.cl | Sólo el gestor del proyecto SUGO (hitos, KPI, cambios)  |
| gerencia@autofix.cl       | Indicadores y consulta de operaciones                    |
| jefe.stgo@autofix.cl      | Operación, presupuestos y validación del taller Santiago |
| recepcion.stgo@autofix.cl | Clientes, vehículos, agenda y recepción                  |
| mecanico.stgo@autofix.cl  | Diagnóstico, evidencias y repuestos                      |
| bodega@autofix.cl         | Inventario y stock                                       |

Los permisos se verifican en la API, además de la navegación y acciones del frontend. El JWT se guarda en sessionStorage y una respuesta 401 cierra la sesión local.

## Flujo operativo conectado

1. Registrar cliente con RUT válido y asociar su vehículo por patente.
2. Reservar en una sucursal usando los horarios y cupos devueltos por el backend.
3. Recepcionar la reserva: crea la OT y registra la asistencia. También se pueden crear OT sin reserva.
4. Pasar a diagnóstico, adjuntar evidencias y preparar un presupuesto con mano de obra y repuestos del catálogo.
5. Enviar el presupuesto. El estado cambia a pendiente de autorización. Un adicional exige evidencia fotográfica según las reglas del backend.
6. El cliente abre su enlace privado sin iniciar sesión interna, revisa y aprueba o rechaza. También se puede registrar una decisión en mostrador, con nombre del cliente.
7. Registrar los repuestos utilizados, sus garantías y validar el consumo. Retirar un repuesto restituye el stock. Los trabajos sin repuestos requieren declaración explícita.
8. Pasar a lista de entrega y entregar. El backend calcula el total aprobado, genera garantías y encola el envío al ERP.
9. Consultar historial por patente o RUT e indicadores desde datos de PostgreSQL.

## Contexto, hitos y KPI del proyecto

Los documentos de `Contexto` definen lo que el sistema debe cumplir:

- `autofix_caso.md`: problemas del negocio (agenda dispersa, presupuestos sin evidencia, repuestos sin trazabilidad, llamadas por estado, garantías entre sucursales).
- `Hitos_Proyecto_SUGO_AutoFix_5.xlsx`: 14 hitos (H1–H14) con fecha, criterio de aceptación, evidencia y responsable.
- `KPI_Proyecto_SUGO_AutoFix_v4.xlsx`: 25 KPI con fórmula, meta y hito en que se miden.

**Gestor del proyecto** (rutas `/`, `/hitos`, `/kpi`, …; roles ADMIN y USUARIO_PROYECTO): carga los 14 hitos y los 25 KPI (`KPI-S01` … `KPI-S25`) con su fórmula ejecutable. Las variables sin dato quedan en *Sin datos* hasta registrarlas. Para regenerar la carga después de editar los Excel:

```powershell
pip install openpyxl
python scripts/gen-hitos-kpi.py   # reescribe Backend/src/proyecto/hitos-kpi.ts
```

**Indicadores de operación** (`/indicadores`, roles GERENCIA, JEFE_TALLER y ADMIN): evalúa en vivo los KPI medibles desde la operación —3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18 y 22–24— contra su meta del Charter. Los KPI de gestión del proyecto (1, 2, 17, 19, 20, 21 y 25) se muestran como *En Proyecto SUGO*. Los hechos que el sistema no genera solo se alimentan con **Registrar hecho** (jefe de taller): reclamos (KPI 7), llamadas por estado (12), compras de repuestos normales/urgentes (9), horas de taller cerradas (15) y atenciones en papel o Excel (6, 16, 22–24).

Cada cambio de estado de la OT se informa al cliente (WhatsApp o correo) y el KPI 18 compara los cambios de estado con los avisos efectivamente enviados.

- Presupuesto autorizado: **$190.000.000 CLP**. No se presenta como gasto ejecutado.
- Fecha comprometida del Charter: **30 de mayo de 2027**.
- El avance corresponde a los valores de los libros. No se inventa progreso según la fecha actual.

## Verificación

```powershell
# Backend
cd Backend
npm run build
npm test
cd ..

# Angular con Node compatible
cd Frontend
& ..\.tools\node_modules\node\bin\node.exe node_modules/@angular/cli/bin/ng.js build
& ..\.tools\node_modules\node\bin\node.exe node_modules/@angular/cli/bin/ng.js test --watch=false
cd ..

# Pruebas reales de navegador: requieren la aplicación iniciada y Chrome
npm install --prefix .tools node@24.15.0 playwright
node scripts/integration.cjs
$env:WITH_PARTS='1'
node scripts/integration.cjs
```

Las pruebas de navegador crean registros identificados como `Integración AutoFix` en la base local. Cubren sesión, clientes, vehículos, reservas y cupos, recepción, diagnóstico, presupuestos, aprobación desde un navegador sin sesión, entrega, historial, contexto, permisos y vista móvil. La variante `WITH_PARTS=1` verifica catálogo, consumo, reversa de stock y garantías. Las capturas se guardan en `.integration`.

## Estado de las integraciones y límites actuales

Cuando `ERP_BASE_URL` e `INVENTARIO_BASE_URL` están vacíos, el backend utiliza sus adaptadores de demostración. La cola de sincronización y sus reintentos sí se guardan en la base; configurar esas URLs y credenciales permite conectar los sistemas externos. El envío de mensajes usa el proveedor de demostración incluido en el repositorio.

Los KPI operativos se calculan desde la API (ver arriba); reclamos, llamadas, compras y cierres de taller dependen de que el jefe de taller los registre. No hay modo offline ni recuperación de contraseña implementados. El esquema se crea con `DB_SYNC=true` en desarrollo; antes de producción hay que generar la migración de las tablas nuevas (`eventos_kpi`, `gestion_proyectos`, columna `notificaciones.estadoOt`).

Para servir el frontend compilado desde NestJS en el puerto 3000, ejecuta el build Angular antes de iniciar NestJS y configura `PUBLIC_URL=http://localhost:3000`. `FRONTEND_DIST` ya apunta al directorio de build Angular. Las fuentes y sus licencias están incluidas en `Frontend/public/fonts`.
