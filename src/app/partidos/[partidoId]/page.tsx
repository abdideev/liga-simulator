"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CheckCircle2, ListOrdered, Play, Users } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import type { DatosEvento } from "@/lib/acciones";
import { minutoActual, obtenerMesa } from "@/lib/mesa";
import { puedeActuarPorEquipo, puedeOperarMesa, puedeResolverProtesta } from "@/lib/permisos";
import { puedeSerConvocado, recalcularMarcador } from "@/lib/rules";
import { MAX_TITULARES } from "@/lib/validaciones";
import type { EventoPartido, Jugador, Lado } from "@/lib/types";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import Etiqueta from "@/components/ui/Etiqueta";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import Marcador from "@/components/partidos/Marcador";
import PanelConvocatoria from "@/components/partidos/PanelConvocatoria";
import PanelRegistrarEvento from "@/components/partidos/PanelRegistrarEvento";
import FeedEventos from "@/components/partidos/FeedEventos";
import PanelModoOffline from "@/components/partidos/PanelModoOffline";
import PanelCierreActa from "@/components/partidos/PanelCierreActa";
import { ESTADO_PARTIDO } from "@/components/partidos/TarjetaPartido";

const DURACION_SINCRONIZACION_MS = 1400;

function Seccion({
  titulo,
  icono: Icono,
  children,
}: {
  titulo: string;
  icono?: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <Tarjeta>
      <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
        {Icono && <Icono size={18} className="text-accent" />}
        {titulo}
      </h2>
      {children}
    </Tarjeta>
  );
}

export default function CapturaPartidoPage() {
  const params = useParams<{ partidoId: string }>();
  const router = useRouter();
  const { estado, despachar } = useSimulador();
  const { equipos, jugadores, partidos, categorias, rolActual, equipoDelegadoId } = estado;

  const partido = partidos.find((p) => p.id === params.partidoId);
  const mesa = obtenerMesa(estado.mesas, params.partidoId);
  const cronometroActivo = mesa.cronometroDesde !== null;

  // The stopwatch lives in the global state as timestamps; this only forces
  // a re-render so the displayed minute advances.
  const [ahoraMs, setAhoraMs] = useState(() => Date.now());
  useEffect(() => {
    if (!cronometroActivo) return;
    const intervalo = setInterval(() => setAhoraMs(Date.now()), 250);
    return () => clearInterval(intervalo);
  }, [cronometroActivo]);

  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);
  useEffect(() => {
    if (!mensajeToast) return;
    const temporizador = setTimeout(() => setMensajeToast(null), 3000);
    return () => clearTimeout(temporizador);
  }, [mensajeToast]);

  if (!partido) {
    return (
      <div className="mx-auto max-w-2xl">
        <EstadoVacio
          icono={ICONO_SECCION.partidos}
          titulo="Partido no encontrado"
          descripcion="Este partido no existe."
          accion={<Boton onClick={() => router.push("/partidos")}>Volver a partidos</Boton>}
        />
      </div>
    );
  }

  const equipoLocal = equipos.find((e) => e.id === partido.equipoLocalId)!;
  const equipoVisitante = equipos.find((e) => e.id === partido.equipoVisitanteId)!;
  const categoria = categorias.find((c) => c.id === partido.categoriaId)!;
  const plantelLocal = jugadores.filter((j) => j.equipoId === equipoLocal.id);
  const plantelVisitante = jugadores.filter((j) => j.equipoId === equipoVisitante.id);
  const convocadosLocalJugadores = plantelLocal.filter((j) => partido.convocadosLocal.includes(j.id));
  const convocadosVisitanteJugadores = plantelVisitante.filter((j) =>
    partido.convocadosVisitante.includes(j.id)
  );

  const actaCerrada = partido.actaCerrada;
  const enCurso = partido.estado === "en_curso";
  const operaMesa = puedeOperarMesa(rolActual);
  const actuaPor = (equipoId: string) => puedeActuarPorEquipo(rolActual, equipoDelegadoId, equipoId);

  const eventosVisibles = [...partido.eventos, ...mesa.colaPendiente];
  const marcador = recalcularMarcador(eventosVisibles, equipoLocal.id, equipoVisitante.id);
  const minuto = minutoActual(mesa, ahoraMs);
  const nombreEquipo = (id: string) =>
    id === equipoLocal.id ? equipoLocal.nombre : equipoVisitante.nombre;

  function avisar(resultado: { ok: boolean; motivo?: string }, exito?: string) {
    if (!resultado.ok) setMensajeToast(resultado.motivo ?? "No se pudo completar la acción");
    else if (exito) setMensajeToast(exito);
    return resultado;
  }

  function registrarEvento(evento: DatosEvento) {
    const tipo = mesa.modoOffline ? "encolarEventoOffline" : "agregarEvento";
    const confirmacionesPrevias =
      partido!.confirmacionDelegadoLocal || partido!.confirmacionDelegadoVisitante;
    const resultado = despachar({ tipo, partidoId: partido!.id, evento });
    if (resultado.ok && tipo === "agregarEvento" && confirmacionesPrevias) {
      setMensajeToast("El acta cambió: los delegados deben volver a confirmarla");
    }
    return resultado;
  }

  function manejarEliminarEvento(evento: EventoPartido) {
    if (mesa.colaPendiente.some((e) => e.id === evento.id)) {
      avisar(despachar({ tipo: "descartarEventoOffline", partidoId: partido!.id, eventoId: evento.id }));
    } else {
      avisar(despachar({ tipo: "eliminarEvento", partidoId: partido!.id, eventoId: evento.id }));
    }
  }

  function alternarModoOffline() {
    if (!mesa.modoOffline) {
      avisar(despachar({ tipo: "establecerModoOffline", partidoId: partido!.id, activo: true }));
      return;
    }
    // Turning back online: flush the pending queue after a simulated delay.
    if (mesa.colaPendiente.length === 0) {
      avisar(despachar({ tipo: "establecerModoOffline", partidoId: partido!.id, activo: false }));
      return;
    }
    const cantidad = mesa.colaPendiente.length;
    const partidoId = partido!.id;
    setSincronizando(true);
    setTimeout(() => {
      const resultado = despachar({ tipo: "sincronizarColaOffline", partidoId });
      setSincronizando(false);
      avisar(resultado, `${cantidad} evento(s) sincronizado(s) correctamente`);
    }, DURACION_SINCRONIZACION_MS);
  }

  function ladoConvocatoria(lado: Lado, plantel: Jugador[]) {
    const equipo = lado === "local" ? equipoLocal : equipoVisitante;
    return {
      nombre: equipo.nombre,
      plantel,
      convocados: lado === "local" ? partido!.convocadosLocal : partido!.convocadosVisitante,
      titulares: lado === "local" ? partido!.titularesLocal : partido!.titularesVisitante,
      editable: !actaCerrada && actuaPor(equipo.id),
      onCambiar: (ids: string[]) =>
        avisar(despachar({ tipo: "actualizarConvocados", partidoId: partido!.id, lado, jugadorIds: ids })),
      onAlternarTitular: (jugadorId: string) =>
        avisar(despachar({ tipo: "alternarTitular", partidoId: partido!.id, lado, jugadorId })),
    };
  }

  const sinTitulares = partido.titularesLocal.length === 0 || partido.titularesVisitante.length === 0;
  const estadoPartido = ESTADO_PARTIDO[partido.estado];

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-16">
      <button
        onClick={() => router.push("/partidos")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Partidos
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {categoria.nombre} · Jornada {partido.jornada} · {partido.fecha} {partido.hora} ·{" "}
          {partido.sede}
        </p>
        <Etiqueta intencion={estadoPartido.intencion} data-testid="estado-partido">
          {estadoPartido.texto}
        </Etiqueta>
      </div>

      <Marcador
        nombreLocal={equipoLocal.nombre}
        nombreVisitante={equipoVisitante.nombre}
        golesLocal={marcador.golesLocal}
        golesVisitante={marcador.golesVisitante}
        minuto={minuto}
        cronometroActivo={cronometroActivo}
        fijo={operaMesa}
        mostrarMinuto={partido.estado !== "programado"}
        puedeControlarCronometro={operaMesa && enCurso}
        onAlternarCronometro={() => avisar(despachar({ tipo: "alternarCronometro", partidoId: partido.id }))}
        onAjustarMinuto={(delta) =>
          avisar(despachar({ tipo: "ajustarMinuto", partidoId: partido.id, delta }))
        }
      />

      <AnimatePresence>
      {mensajeToast && (
        <motion.div
          key={mensajeToast}
          initial={{ opacity: 0, y: 24, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 12, scale: 0.95, x: "-50%" }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          role="status"
          data-testid="toast"
          className="fixed bottom-4 left-1/2 z-40 max-w-[calc(100%-2rem)] rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper shadow-elevada"
        >
          {mensajeToast}
        </motion.div>
      )}
      </AnimatePresence>

      {!operaMesa && (
        <Aviso intencion="accent">
          Como delegado puedes convocar a tu equipo y firmar el acta de tu lado. La captura del
          partido la realiza la mesa de control (administrador).
        </Aviso>
      )}

      {partido.estado === "programado" && operaMesa && (
        <div className="space-y-2">
          <Boton
            onClick={() => avisar(despachar({ tipo: "iniciarPartido", partidoId: partido.id }))}
            disabled={sinTitulares}
            data-testid="boton-iniciar-partido"
          >
            <Play size={16} />
            Iniciar partido
          </Boton>
          {sinTitulares && (
            <p className="text-xs text-muted">
              Convoca al menos un jugador titular de cada equipo para poder iniciar el partido.
            </p>
          )}
        </div>
      )}

      <Seccion titulo="Convocatoria" icono={Users}>
        <PanelConvocatoria
          local={ladoConvocatoria("local", plantelLocal)}
          visitante={ladoConvocatoria("visitante", plantelVisitante)}
          maxTitulares={MAX_TITULARES}
          convocable={(jugador) => puedeSerConvocado(jugador, partido, partidos)}
        />
      </Seccion>

      {enCurso && operaMesa && (
        <Seccion titulo="Modo sin conexión">
          <PanelModoOffline
            activo={mesa.modoOffline}
            sincronizando={sincronizando}
            pendientes={mesa.colaPendiente.length}
            onAlternar={alternarModoOffline}
          />
        </Seccion>
      )}

      {enCurso && operaMesa && (
        <Seccion titulo="Registrar evento">
          <PanelRegistrarEvento
            minutoActual={minuto}
            nombreLocal={equipoLocal.nombre}
            nombreVisitante={equipoVisitante.nombre}
            equipoLocalId={equipoLocal.id}
            equipoVisitanteId={equipoVisitante.id}
            convocadosLocal={convocadosLocalJugadores}
            convocadosVisitante={convocadosVisitanteJugadores}
            onRegistrar={registrarEvento}
          />
        </Seccion>
      )}

      <Seccion titulo="Bitácora del partido" icono={ListOrdered}>
        <FeedEventos
          eventos={eventosVisibles}
          jugadores={[...plantelLocal, ...plantelVisitante]}
          nombreEquipo={nombreEquipo}
          puedeEliminar={operaMesa && !actaCerrada}
          onEliminar={manejarEliminarEvento}
        />
      </Seccion>

      <Seccion titulo="Cierre de acta" icono={CheckCircle2}>
        <PanelCierreActa
          local={{
            lado: "local",
            nombreEquipo: equipoLocal.nombre,
            confirmado: partido.confirmacionDelegadoLocal,
            protesta: partido.protestaLocal,
            puedeFirmar: actuaPor(equipoLocal.id),
          }}
          visitante={{
            lado: "visitante",
            nombreEquipo: equipoVisitante.nombre,
            confirmado: partido.confirmacionDelegadoVisitante,
            protesta: partido.protestaVisitante,
            puedeFirmar: actuaPor(equipoVisitante.id),
          }}
          actaCerrada={actaCerrada}
          enCurso={enCurso}
          pendientesOffline={mesa.colaPendiente.length}
          puedeCerrar={operaMesa}
          puedeResolver={puedeResolverProtesta(rolActual)}
          onConfirmar={(lado, confirmado) =>
            despachar({ tipo: "establecerConfirmacion", partidoId: partido.id, lado, confirmado })
          }
          onProtestar={(lado, motivo) =>
            despachar({ tipo: "registrarProtesta", partidoId: partido.id, lado, motivo })
          }
          onRetirarProtesta={(lado) =>
            despachar({ tipo: "retirarProtesta", partidoId: partido.id, lado })
          }
          onResolver={(lado, texto) =>
            despachar({ tipo: "resolverProtesta", partidoId: partido.id, lado, texto })
          }
          onCerrarActa={() =>
            avisar(despachar({ tipo: "cerrarActa", partidoId: partido.id }), "Acta cerrada correctamente")
          }
        />
      </Seccion>
    </div>
  );
}
