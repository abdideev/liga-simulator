# Simulador — Sistema de Gestión de Ligas Deportivas

Prototipo navegable creado por **A&I Software** para validar, junto con el
organizador de una liga amateur de fútbol, el flujo completo de una jornada
antes de escribir una sola línea de código de producción.

## Qué es este prototipo

- Una interfaz **100% en español** que reproduce las pantallas principales
  del sistema propuesto: configuración de liga, equipos, inscripción de
  jugadores, cierre de registro, calendario, captura de partido (mesa de
  control), tabla de posiciones/estadísticas, vista pública y bitácora de
  auditoría.
- Datos de ejemplo realistas (una liga municipal ficticia, "Liga Municipal
  de Tlahuelilpan") con 6 equipos, ~72 jugadores, un calendario generado y
  2 partidos ya jugados, para que la tabla de posiciones y las estadísticas
  no arranquen vacías.
- Reglas de negocio reales implementadas como funciones puras
  (`src/lib/rules.ts`): elegibilidad por edad, validación estructural de
  CURP, suspensión automática por tarjetas y cálculo de tabla de posiciones
  con criterios de desempate.

## Qué NO es este prototipo

- **No hay backend real.** Todo vive en el navegador: un `SimuladorContext`
  de React mantiene el estado en memoria y lo persiste en `localStorage`
  para que un refresco de página no borre el progreso de la demo.
- **No hay autenticación.** El "selector de rol" en la barra superior es
  una simulación: cambia qué menús y acciones se muestran, pero no valida
  ninguna credencial ni contraseña.
- **La validación de CURP es solo estructural.** Se revisa longitud, patrón
  de caracteres y que la fecha codificada coincida con la fecha de
  nacimiento capturada. **No se consulta ningún registro oficial (RENAPO)**
  ni se garantiza que la CURP sea auténtica.
- **El "Modo sin conexión" es una simulación de interfaz.** No hay un
  service worker real ni sincronización contra un servidor: los eventos se
  guardan en memoria del navegador mientras el modo está activo y se
  "sincronizan" (con una espera artificial) al desactivarlo.
- No incluye convocatoria pública de equipos/jugadores libres (queda para
  una Fase 2), pagos o facturación, ni envío real de correos o SMS.

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
en unos 15–20 minutos.

1. **Selector de rol.** Muestra el menú desplegable en la barra superior:
   cambia entre *Administrador de liga*, *Delegado de equipo* y *Vista
   pública* y señala cómo cambian las opciones del menú lateral. Vuelve a
   *Administrador de liga* para continuar.

2. **Configuración de liga** (`/configuracion`). Muestra el nombre de la
   liga, la temporada activa y las dos categorías precargadas (Libre y
   Juvenil Sub-17), cada una con su rango de años de nacimiento, cupo de
   equipos y límite de plantel. Edita un valor para mostrar que es
   configurable.

3. **Equipos** (`/equipos`). Muestra los 6 equipos agrupados por categoría,
   con su delegado y teléfono. Registra un equipo nuevo en vivo para
   mostrar el flujo de alta.

4. **Inscripción de jugadores.** Entra al plantel de cualquier equipo de
   **Juvenil Sub-17** y muestra:
   - Un jugador con estado **Elegible** (normal).
   - Que **todos** los jugadores de esta categoría son menores de edad y
     tienen el nombre del tutor y su consentimiento capturado.
   - Inscribe un jugador nuevo en vivo: llena la fecha de nacimiento de
     un menor y muestra cómo aparece el bloque de consentimiento del
     tutor, obligatorio antes de poder guardar.
   - Entra al plantel de **Atlético Minero** (categoría Libre) y localiza
     al jugador con la insignia **"Requiere revisión manual"** — su CURP
     fue capturada incompleta a propósito. Muestra el panel de anulación
     manual del administrador (con motivo obligatorio).

5. **Cierre de registro** (`/registro`). Explica que esta acción congela
   los planteles de una categoría en una fecha determinada. Ciérralo para
   una categoría y muestra cómo su plantel pasa a modo solo lectura.

6. **Calendario** (`/calendario`). Muestra el calendario generado
   (todos-contra-todos) agrupado por jornada. Señala que la Jornada 1 ya
   se jugó (por eso hay resultados) y que la Jornada 2 está programada
   para *hoy* — es el partido que se va a capturar en vivo a continuación.
   Opcionalmente, genera un calendario nuevo para otra categoría.

7. **Captura del partido — mesa de control** (`/partidos`, elige un
   partido "Programado"). Este es el corazón de la demo:
   - Selecciona la convocatoria de ambos equipos (marca jugadores). Señala
     que un jugador suspendido (por la tarjeta roja de la Jornada 1)
     aparece bloqueado con el motivo visible.
   - Pulsa **"Iniciar partido"** y muestra el cronómetro corriendo.
   - Registra un par de eventos (gol, tarjeta amarilla) y muestra cómo se
     actualiza el marcador y la bitácora del partido en tiempo real.
   - Activa **"Modo sin conexión"**: muestra el aviso, registra un evento
     "sin conexión" y señala el contador de pendientes. Desactívalo y
     muestra el estado "Sincronizando…" y el aviso de éxito.
   - Marca las dos casillas de confirmación de delegados y cierra el acta.

8. **Tabla y estadísticas** (`/estadisticas`). Muestra cómo la tabla de
   posiciones, la tabla de goleo/tarjetas y la lista de suspendidos se
   recalculan solas a partir de los partidos capturados.

9. **Vista pública** (`/publico`, o cambia el rol a *Vista pública*).
   Muestra que cualquier persona puede consultar calendario, resultados,
   posiciones y goleo — y que **no se expone ningún dato personal**
   (sin CURP, sin fecha de nacimiento, sin datos del tutor), incluso para
   los jugadores menores de edad.

10. **Bitácora** (`/bitacora`). Cierra la demo mostrando el registro de
    auditoría: cada acción relevante (inscripciones, cierres de registro,
    eventos de partido, cierres de acta) queda con fecha, rol y detalle.

## Comportamientos simulados (resumen)

| Comportamiento | Cómo está simulado |
|---|---|
| Roles y permisos | Selector en la barra superior; sin login ni contraseña |
| Validación de CURP | Solo estructura y consistencia de fecha; sin RENAPO |
| Modo sin conexión | Cola en memoria del navegador + espera artificial al sincronizar |
| Persistencia | `localStorage` del navegador, no una base de datos |
| Fotografías de jugador | Marcador de posición (iniciales), sin carga real de archivos |

## Organización del código

```
src/app/...                 rutas de cada pantalla (Next.js App Router)
src/components/...          componentes de interfaz reutilizables
src/context/SimuladorContext.tsx   estado global + acciones (simula el backend)
src/lib/types.ts            modelo de datos del dominio
src/lib/seed.ts             datos de ejemplo
src/lib/rules.ts            reglas de negocio puras: elegibilidad, tabla, suspensiones
src/lib/calendario.ts       generador de calendario todos-contra-todos
src/lib/storage.ts          helpers de localStorage
```

Las reglas de negocio (`rules.ts`) están completamente desacopladas de los
componentes de React — son funciones puras y probables de forma aislada —
para reflejar la arquitectura por capas que tendría el sistema real.
