# Modernización de la operación de una cadena de talleres automotrices

**Empresa ficticia:** AutoFix

## Antecedentes

AutoFix es una empresa chilena que opera una red de 17 talleres automotrices ubicados entre La Serena y Puerto Montt. La organización nació como una empresa familiar, pero durante los últimos seis años adquirió talleres independientes y aumentó considerablemente su tamaño.

Actualmente atiende aproximadamente 13.500 vehículos al mes y posee una base histórica cercana a 280.000 clientes. Cada taller mantiene una forma de trabajo relativamente independiente. Algunos utilizan un software comercial antiguo, otros trabajan con planillas Excel y tres todavía utilizan órdenes impresas.

La gerencia general considera que esta situación está comenzando a limitar el crecimiento de la organización. Durante los próximos tres años la empresa espera llegar a 30 sucursales.

## Situación actual

Cuando un cliente solicita una atención puede hacerlo por diferentes canales:

- Llamar directamente a una sucursal.
- Enviar un mensaje por WhatsApp.
- Presentarse presencialmente.
- Completar un formulario disponible en el sitio web corporativo.

Cada taller administra su propia agenda. Por esta razón, la casa matriz no dispone de información consolidada respecto de la cantidad real de horas disponibles para atención.

Durante períodos de alta demanda algunos talleres tienen reservas para más de diez días, mientras otros poseen capacidad ociosa. La empresa estima que aproximadamente 12 % de las horas reservadas no se utilizan, principalmente debido a clientes que no llegan o reservas duplicadas.

### Recepción de vehículos

Cuando un vehículo ingresa al taller se genera una orden de trabajo. Dependiendo del establecimiento, esta información puede quedar registrada en papel, Excel o software local.

La orden contiene normalmente:

- Datos del cliente.
- Vehículo.
- Kilometraje.
- Motivo de consulta.
- Trabajos solicitados.
- Observaciones iniciales.

No existe actualmente un formato único. Un mismo cliente puede aparecer varias veces en diferentes sucursales.

### Diagnóstico y presupuesto

Después de revisar el vehículo, el taller genera un presupuesto. En algunas ocasiones el presupuesto cambia durante la reparación porque aparecen nuevos problemas.

Actualmente estas modificaciones normalmente se autorizan mediante llamada telefónica o WhatsApp. Han existido reclamos de clientes porque no existe evidencia clara de qué presupuesto fue efectivamente aceptado.

Durante el último año se registraron 317 reclamos asociados a diferencias entre presupuesto y cobro final.

### Repuestos

La empresa posee una bodega central y pequeñas bodegas en cada sucursal. El sistema de inventario utilizado por la empresa permite consultar código del producto, descripción, existencia, precio y ubicación. Sin embargo, dicho sistema no conoce qué repuestos fueron efectivamente utilizados en cada vehículo.

Cuando falta un repuesto, puede ocurrir que:

- Se solicite a otra sucursal.
- Se solicite a la bodega central.
- Se compre directamente a un proveedor.

La gerencia quiere reducir las compras urgentes porque actualmente representan aproximadamente 18 % de las adquisiciones de repuestos y tienen un costo considerablemente superior.

### Ejecución del trabajo

Los mecánicos reciben trabajos según la carga existente. La compañía posee aproximadamente:

- 96 mecánicos.
- 21 técnicos especialistas.
- 34 personas de recepción y administración.
- 17 jefes de taller.

Los funcionarios no necesariamente permanecen asignados a un solo tipo de reparación. Algunos trabajos requieren especialistas específicos, por ejemplo transmisión automática, sistemas eléctricos, aire acondicionado o vehículos híbridos. No todos los talleres poseen especialistas en todas las áreas.

### Información para el cliente

La encuesta de satisfacción realizada durante 2025 mostró que uno de los principales problemas percibidos por los clientes es no conocer el estado de su vehículo. Actualmente deben llamar al taller.

Durante una jornada normal una sucursal puede recibir entre 40 y 70 llamadas preguntando por el estado de reparaciones. La empresa quiere disminuir estas llamadas considerablemente.

### Retiro y pago

Al finalizar el trabajo se genera el cobro, se recibe el pago y se entrega el vehículo. La facturación se realiza mediante el ERP corporativo. El ERP no será reemplazado.

El proveedor informa que dispone de servicios para recibir información desde aplicaciones externas, pero cualquier modificación realizada por ellos posee costo adicional.

### Garantías

Determinadas reparaciones poseen garantía. Actualmente verificar una garantía implica buscar la orden anterior. Cuando el trabajo se realizó en otra sucursal, el proceso puede tardar considerablemente.

La empresa desea que la información histórica pueda ser consultada independientemente del taller donde se encuentre el vehículo.

## Información tecnológica existente

La compañía posee:

- Sitio web corporativo.
- ERP financiero.
- Sistema de inventario.
- Microsoft 365.
- Cuentas corporativas para todos los trabajadores administrativos.
- Infraestructura cloud contratada con un proveedor nacional.

El área informática interna está formada por cinco personas, cuya función principal es soporte tecnológico. La empresa no posee actualmente un equipo propio de desarrollo de software.

## Decisión de la gerencia

El Directorio aprobó la realización de un proyecto de software destinado a solucionar los problemas anteriores. Ha establecido un presupuesto máximo inicial de **$190.000.000 CLP**.

La gerencia espera disponer de una primera operación funcional dentro de **8 meses**. Se ha planteado utilizar inicialmente tres sucursales: **Santiago, Rancagua y Viña del Mar**.

Si la experiencia es satisfactoria, la solución deberá extenderse posteriormente al resto de la empresa. La gerencia no ha definido cómo debe ser técnicamente la solución. Tampoco ha determinado qué funciones deben desarrollarse primero.

## Restricciones conocidas

La empresa ha establecido que:

- El ERP actual deberá continuar funcionando.
- El sistema de inventario tampoco será reemplazado.
- Las sucursales no pueden detener sus operaciones para realizar la implementación.
- Los mecánicos no pueden dedicar jornadas completas a actividades del proyecto.
- Durante diciembre y enero los talleres alcanzan su mayor demanda.
- Cualquier capacitación debe organizarse sin cerrar sucursales.

Adicionalmente, el Director Comercial quiere que los clientes puedan interactuar con la solución desde dispositivos móviles. El Gerente de Operaciones considera más importante mejorar primero los procesos internos. El Directorio todavía no ha resuelto esta diferencia.
