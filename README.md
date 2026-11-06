# AutoFix · SUGO

## Backend y PostgreSQL con Docker

Con Docker Desktop iniciado, desde esta carpeta ejecuta:

```powershell
docker compose up -d --build
```

La API queda disponible en http://localhost:3000/api y Swagger en http://localhost:3000/api/docs. Compose espera a que PostgreSQL esté disponible antes de iniciar el backend. Los archivos adjuntos se conservan en `Backend/uploads` y la base de datos en el volumen `autofix_pgdata`. Para detener los servicios, ejecuta `docker compose stop`.

La configuración opcional `Backend/.env` se carga en el backend. Para mantener las credenciales de ambos servicios sincronizadas, define `DB_USER`, `DB_PASSWORD` y `DB_NAME` en un archivo `.env` en la raíz del repositorio; Compose las aplica a ambos contenedores. El puerto externo de la API se puede cambiar con `BACKEND_PORT`. Esta configuración está orientada al desarrollo. Detén cualquier backend local que ya use el puerto 3000 antes de iniciarla. Si usas el frontend Angular de desarrollo, ejecútalo por separado; el script `Iniciar-AutoFix.ps1` inicia su propio backend local y no debe ejecutarse simultáneamente con el contenedor del backend.

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

Abre `AutoFix.code-workspace` en Visual Studio Code. La tarea **AutoFix: Iniciar** ejecuta el mismo script. El prototipo React se conserva en `Frontend-React` como referencia del diseño; se ejecuta por separado con `npm install` y `npm run dev` desde esa carpeta.

## Cuentas del entorno local

Al iniciar una base vacía se cargan sucursales, usuarios, clientes, vehículos y repuestos de ejemplo. Contraseña de las cuentas de demostración: `Autofix2026!`.

| Cuenta                    | Uso                                                      |
| ------------------------- | -------------------------------------------------------- |
| admin@autofix.cl          | Todas las funciones e integraciones                      |
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

## Contexto y planificación

`Proyecto SUGO` muestra una línea base de consulta obtenida de los tres libros versionados en `Contexto`: 20 actividades, 5 hitos, 20 recursos, 15 riesgos y 8 criterios de éxito. Incluye Carta Gantt, predecesoras, responsables, fechas y exportación CSV compatible con Excel.

- Presupuesto autorizado: **$190.000.000 CLP**. No se presenta como gasto ejecutado.
- Fecha comprometida del Charter: **30 de mayo de 2027**. La EDT extiende el cierre administrativo al 31 de mayo; esta diferencia se muestra en la pantalla.
- El avance corresponde a los valores de los libros. No se inventa progreso según la fecha actual.
- La planificación es una referencia documental de solo lectura; las acciones operativas se guardan en PostgreSQL. No hay edición de planificación ni control de cambios del proyecto persistidos.

Para regenerar la línea base después de editar los documentos:

```powershell
node scripts/extract-context.cjs
```

El lector local utiliza valores guardados de las celdas; no ejecuta macros ni recalcula fórmulas. Se comprobó que su extracción coincide con la realizada inicialmente con XLSX. Reinicia el backend para cargar una nueva versión del contexto.

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

El KPI de no-show y los indicadores de OT, presupuestos y stock se calculan desde la API. Compras urgentes, reclamos y reducción de llamadas aparecen como **pendientes de medición**, porque aún no tienen registros de origen en el backend. No hay modo offline ni recuperación de contraseña implementados.

Para servir el frontend compilado desde NestJS en el puerto 3000, ejecuta el build Angular antes de iniciar NestJS y configura `PUBLIC_URL=http://localhost:3000`. `FRONTEND_DIST` ya apunta al directorio de build Angular. Las fuentes y sus licencias están incluidas en `Frontend/public/fonts`.
