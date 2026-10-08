# Simulador — Sistema de Gestión de Ligas Deportivas

Prototipo navegable creado por **A&I Software** para validar, junto con el
organizador de una liga amateur de fútbol, el flujo completo de una jornada
antes de escribir una sola línea de código de producción.

## Qué es este prototipo

- Una interfaz **100% en español** que reproduce las pantallas principales
  del sistema propuesto: configuración de liga, equipos, inscripción de
  jugadores, cierre de registro (con ventana de altas extemporáneas),
  calendario, captura de partido (mesa de control), tabla de
  posiciones/estadísticas, vista pública y bitácora de auditoría.
- Datos de ejemplo realistas (una liga municipal ficticia, "Liga Municipal
  de Tlahuelilpan") con 6 equipos, 72 jugadores, un calendario generado y
  la Jornada 1 de cada categoría ya jugada. **Las fechas se calculan a
  partir del día en que se abre el prototipo:** la Jornada 1 se jugó hace
  dos semanas y la **Jornada 2 está programada para hoy**.
- Reglas de negocio reales implementadas como funciones puras en
  `src/lib/`: elegibilidad por edad, validación estructural de CURP,
  límite de plantel y números de playera, suspensión automática por
  tarjetas, convocatoria solo de jugadores elegibles, firma del acta con
  confirmación o protesta, y cálculo de tabla con criterios de desempate.
- Permisos por rol aplicados en cada pantalla y en cada ruta, no solo en
  el menú: un rol no puede abrir por URL lo que no le corresponde.

## Qué NO es este prototipo

- **No hay backend real.** Todo vive en el navegador: un `SimuladorContext`
  de React mantiene el estado en memoria y lo persiste en `localStorage`
  (con versión de esquema) para que un refresco de página no borre el
  progreso de la demo.
- **No hay autenticación.** El "selector de rol" de la barra superior es
  una simulación; cuando el rol es *Delegado de equipo* aparece un segundo
  selector para elegir qué equipo representa. No se valida ninguna
  credencial.
- **La validación de CURP es solo estructural.** Se revisa longitud, patrón
  de caracteres y que la fecha codificada coincida con la fecha de
  nacimiento capturada. **No se consulta ningún registro oficial (RENAPO)**
  ni se garantiza que la CURP sea auténtica.
- **El "Modo sin conexión" es una simulación de interfaz.** No hay un
  service worker ni detección real de conectividad: el interruptor es
  manual y los eventos se guardan en una cola local del navegador que se
  "sincroniza" (con una espera artificial) al desactivarlo. La cola y el
  cronómetro sí se conservan al salir de la mesa de control y volver.
- No incluye convocatoria pública de equipos/jugadores libres (Fase 2),
  solicitudes ARCO (RF-21), exportación de cédula y padrón (RF-22), pagos o
  facturación, ni envío real de correos o SMS.

## Cómo ejecutarlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La app arranca con los
datos de ejemplo precargados. Usa el botón **"Reiniciar simulación"** (en el
menú, o junto al selector de rol en pantallas grandes) para borrar el
progreso capturado durante la demo y volver al punto de partida.

Otros comandos útiles:

```bash
npm run build   # build de producción
npm run start   # sirve el build de producción
npm run lint    # revisa el código con ESLint
```

## Guion de demostración guiada

Pensado para mostrarle al cliente una jornada completa, de principio a fin,
en unos 20 minutos. Conviene pulsar **Reiniciar** antes de empezar.

1. **Selector de rol.** Muestra el menú desplegable en la barra superior:
   cambia entre *Administrador de liga*, *Delegado de equipo* y *Vista
   pública* y señala cómo cambian las opciones del menú lateral. Con
   *Delegado de equipo* aparece el selector "Delegado de": en *Equipos*
   solo el plantel de su propio equipo se puede abrir; los demás aparecen
   como "Plantel privado". Vuelve a *Administrador de liga*.

2. **Configuración de liga** (`/configuracion`). Muestra el nombre de la
   liga, la temporada activa y las dos categorías precargadas (Libre y
   Juvenil Sub-17), cada una con su rango de años de nacimiento, cupo de
   equipos y límite de plantel. Al editar el rango de años de una
   categoría, la elegibilidad de sus jugadores se recalcula y queda en la
   bitácora.

3. **Equipos** (`/equipos`). Muestra los 6 equipos agrupados por categoría,
   con su delegado y teléfono. Intenta registrar un cuarto equipo en una
   categoría: el sistema lo rechaza porque el cupo es de 3.

4. **Inscripción de jugadores.** Entra al plantel de cualquier equipo de
   **Juvenil Sub-17** y muestra:
   - Que **todos** los jugadores de esta categoría son menores de edad y
     tienen tutor con consentimiento.
   - Inscribe un jugador nuevo en vivo: al capturar la fecha de nacimiento
     de un menor aparece el bloque de consentimiento del tutor,
     obligatorio. Intenta repetir un número de playera para mostrar la
     validación.
   - Entra al plantel de **Atlético Minero** (Libre) y localiza al jugador
     #5 con la insignia **"Requiere revisión manual"** (su CURP está
     incompleta a propósito). Muestra el panel de anulación manual del
     administrador (con motivo obligatorio).

5. **Cierre de registro** (`/registro`). Cierra el registro de una
   categoría y muestra que su plantel pasa a solo lectura. Después abre
   una **ventana de altas extemporáneas** (fecha límite y motivo
   obligatorios): el formulario de inscripción reaparece y cada alta queda
   marcada como extemporánea y registrada en la bitácora.

6. **Calendario** (`/calendario`). Muestra el calendario todos contra todos
   agrupado por jornada, con el equipo que descansa en cada jornada. La
   Jornada 1 ya se jugó y la Jornada 2 tiene la insignia **Hoy**.

7. **Captura del partido — mesa de control** (`/partidos` → *Libre,
   Jornada 2: Real Tlahuelilpan FC vs Atlético Minero*). Este es el
   corazón de la demo:
   - **Convocatoria.** En Atlético Minero, el #7 aparece **suspendido**
     (tarjeta roja en la Jornada 1) y el #5 **no convocable** (revisión
     manual de CURP). Los primeros 11 convocados quedan como titulares;
     el resto como suplentes (se puede alternar).
   - Pulsa **"Iniciar partido"** y muestra el cronómetro corriendo
     (acelerado: 1 minuto de partido por segundo real).
   - Registra un par de eventos (gol, tarjeta amarilla) y muestra cómo se
     actualizan el marcador y la bitácora del partido.
   - Activa **"Modo sin conexión"**, registra un evento y señala el
     contador de pendientes. Sal a *Partidos* y regresa: la cola y el
     cronómetro siguen ahí. Desactívalo y muestra "Sincronizando…".
   - **Cierre de acta.** Un delegado confirma; el otro **firma con
     protesta** (motivo obligatorio). Si se registra otro evento, las
     confirmaciones se reinician. Cierra el acta: queda "con protesta" y
     el administrador puede registrar la resolución.
   - Opcional: abre *Juvenil Sub-17, Jornada 3 (Halcones vs Tigres)*. El
     jugador de Tigres expulsado en la Jornada 1 sigue suspendido aunque
     su equipo descansó en la Jornada 2: la sanción se cumple en el
     **siguiente partido de su equipo**, no en la siguiente jornada.

8. **Tabla y estadísticas** (`/estadisticas`). La tabla de posiciones, el
   goleo/tarjetas (solo partidos finalizados; PJ cuenta titulares y
   jugadores que entraron de cambio) y la lista de suspendidos se
   recalculan solas a partir de las actas cerradas.

9. **Vista pública** (`/publico`, o cambia el rol a *Vista pública*).
   Cualquier persona puede consultar calendario, resultados, posiciones y
   goleo, y **no se expone ningún dato personal** (sin CURP, fecha de
   nacimiento, edad ni tutor). Con este rol, intenta abrir
   `/equipos/equipo-4` en la barra de direcciones: aparece **Acceso
   restringido**.

10. **Bitácora** (`/bitacora`). Cierra la demo mostrando el registro de
    auditoría: cada acción relevante queda con fecha, rol, el partido,
    equipo o categoría afectados (con nombres legibles) y el detalle.

## Comportamientos simulados (resumen)

| Comportamiento | Cómo está simulado |
|---|---|
| Roles y permisos | Selector en la barra superior (y equipo del delegado); sin login. Las reglas se aplican en rutas, pantallas y acciones |
| Validación de CURP | Solo estructura y consistencia de fecha; sin RENAPO |
| Modo sin conexión | Interruptor manual + cola persistida en el navegador + espera artificial al sincronizar |
| Cronómetro | Acelerado (1 minuto por segundo); persistido como marcas de tiempo |
| Persistencia | `localStorage` del navegador con versión de esquema, no una base de datos |
| Fotografías de jugador | Marcador de posición (iniciales), sin carga real de archivos |

## Decisiones de este ciclo

- **Elegibilidad por año de nacimiento** (no por fecha exacta): se mantiene
  hasta confirmarlo con el reglamento del área municipal de deportes.
- **Operación sin conexión (RNF-01/RNF-02):** se mantiene como simulación;
  la versión real (service worker, IndexedDB, `navigator.onLine`) queda
  para un ciclo posterior.
- **Tipografía:** Satoshi no está disponible en Google Fonts; se usa
  **Plus Jakarta Sans** (la alternativa más cercana), auto-hospedada con
  `next/font` para que funcione sin internet.

## Organización del código

```
src/app/...                        rutas de cada pantalla (Next.js App Router)
src/components/...                 componentes de interfaz
src/components/ui/...              sistema de diseño: Boton, Etiqueta, Tarjeta, Aviso, Campo…
src/context/SimuladorContext.tsx   valida y despacha acciones; persiste el estado
src/lib/types.ts                   modelo de datos del dominio
src/lib/acciones.ts                catálogo de acciones (AccionSimulador) y su entorno
src/lib/reducer.ts                 simuladorReducer: máquina de estados pura
src/lib/validaciones.ts            validarAccion: reglas que aceptan o rechazan cada acción
src/lib/rules.ts                   reglas de negocio puras: elegibilidad, tabla, suspensiones…
src/lib/permisos.ts                permisos por rol (rutas, plantel, mesa, firma del acta)
src/lib/calendario.ts              generador de calendario todos contra todos
src/lib/mesa.ts                    cronómetro y cola sin conexión de la mesa de control
src/lib/seed.ts                    datos de ejemplo (deterministas para una fecha dada)
src/lib/fechas.ts, ids.ts          fechas en hora local e IDs inyectables
src/lib/storage.ts                 helpers de localStorage con versión de esquema
```

### Arquitectura para pruebas

La lógica de negocio está desacoplada de React para poder probarse de
forma aislada y determinista:

- `simuladorReducer(estado, accion, entorno)` es una función pura. Todo lo
  no determinista llega en `entorno`: el generador de IDs (`crearId`) y la
  fecha actual (`ahora`). Una acción inválida devuelve el mismo estado.
- `validarAccion(estado, accion, entorno)` devuelve `{ ok, motivo }`. El
  contexto la ejecuta **antes** de `setEstado`, de modo que el resultado
  que recibe la pantalla es confiable.
- `crearEstadoInicial(referencia, crearId)` genera los mismos datos para la
  misma fecha de referencia.
- Las funciones dependientes del tiempo (`calcularEdad`, `esMenorDeEdad`)
  aceptan una fecha `referencia` inyectable.
- `SimuladorProvider` acepta `crearId` y `reloj` opcionales.
- Los elementos clave de la interfaz tienen atributos `data-testid`
  (por ejemplo `boton-iniciar-partido`, `toggle-modo-offline`,
  `boton-cerrar-acta`, `fila-jugador-<id>`, `convocable-<id>`,
  `selector-rol`).
