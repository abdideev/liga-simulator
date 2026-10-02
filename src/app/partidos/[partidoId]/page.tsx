"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardList, Play, Users } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Boton from "@/components/ui/Boton";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import Marcador from "@/components/partidos/Marcador";
import PanelConvocatoria from "@/components/partidos/PanelConvocatoria";
import PanelRegistrarEvento from "@/components/partidos/PanelRegistrarEvento";
import FeedEventos from "@/components/partidos/FeedEventos";
import PanelModoOffline from "@/components/partidos/PanelModoOffline";
import PanelCierreActa from "@/components/partidos/PanelCierreActa";
import { calcularSuspensionParaJornada, recalcularMarcador } from "@/lib/rules";
import type { EventoPartido } from "@/lib/types";

const DURACION_SINCRONIZACION_MS = 1400;

export default function CapturaPartidoPage() {
  const params = useParams<{ partidoId: string }>();
  const router = useRouter();
  const {
    estado,
    actualizarConvocados,
    cambiarEstadoPartido,
    agregarEvento,
    eliminarEvento,
    confirmarDelegado,
    cerrarActa,
  } = useSimulador();
  const { equipos, jugadores, partidos, categorias } = estado;

  const partido = partidos.find((p) => p.id === params.partidoId);

  const [minutoActual, setMinutoActual] = useState(0);
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [modoOffline, setModoOffline] = useState(false);
  const [colaPendiente, setColaPendiente] = useState<EventoPartido[]>([]);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);
  const contadorTemporal = useRef(0);

  useEffect(() => {
    if (!cronometroActivo) return;
    const intervalo = setInterval(() => setMinutoActual((m) => m + 1), 1000);
    return () => clearInterval(intervalo);
  }, [cronometroActivo]);

  useEffect(() => {
    if (!mensajeToast) return;
    const temporizador = setTimeout(() => setMensajeToast(null), 3000);
    return () => clearTimeout(temporizador);
  }, [mensajeToast]);

  if (!partido) {
    return (
      <div className="mx-auto max-w-2xl">
        <EstadoVacio
          icono={ClipboardList}
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
  const convocadosLocalJugadores = plantelLocal.filter((j) =>
    partido.convocadosLocal.includes(j.id)
  );
  const convocadosVisitanteJugadores = plantelVisitante.filter((j) =>
    partido.convocadosVisitante.includes(j.id)
  );

  const actaCerrada = partido.actaCerrada;
  const eventosVisibles = [...partido.eventos, ...colaPendiente];
  const marcador = recalcularMarcador(eventosVisibles, equipoLocal.id, equipoVisitante.id);

  function suspendidoParaEstePartido(jugadorId: string) {
    return calcularSuspensionParaJornada(jugadorId, categoria.id, partido!.jornada, partidos);
  }

  function registrarEvento(evento: Omit<EventoPartido, "id" | "partidoId">) {
    if (modoOffline) {
      contadorTemporal.current += 1;
      const temporal: EventoPartido = {
        ...evento,
        id: `pendiente-${contadorTemporal.current}`,
        partidoId: partido!.id,
        registradoOffline: true,
      };
      setColaPendiente((prev) => [...prev, temporal]);
    } else {
      agregarEvento(partido!.id, evento);
    }
  }

  function manejarEliminarEvento(eventoId: string) {
    if (eventoId.startsWith("pendiente-")) {
      setColaPendiente((prev) => prev.filter((e) => e.id !== eventoId));
    } else {
      eliminarEvento(partido!.id, eventoId);
    }
  }

  function alternarModoOffline() {
    if (!modoOffline) {
      setModoOffline(true);
      return;
    }
    // Turning back online: flush the pending queue.
    if (colaPendiente.length === 0) {
      setModoOffline(false);
      return;
    }
    setSincronizando(true);
    setTimeout(() => {
      colaPendiente.forEach((evento) => {
        agregarEvento(partido!.id, {
          minuto: evento.minuto,
          tipo: evento.tipo,
          equipoId: evento.equipoId,
          jugadorId: evento.jugadorId,
          jugadorEntraId: evento.jugadorEntraId,
          registradoOffline: true,
        });
      });
      const cantidad = colaPendiente.length;
      setColaPendiente([]);
      setSincronizando(false);
      setModoOffline(false);
      setMensajeToast(`${cantidad} evento(s) sincronizado(s) correctamente`);
    }, DURACION_SINCRONIZACION_MS);
  }

  function manejarCerrarActa() {
    const resultado = cerrarActa(partido!.id);
    if (!resultado.ok) {
      setMensajeToast(resultado.motivo ?? "No se pudo cerrar el acta");
    } else {
      setCronometroActivo(false);
      setMensajeToast("Acta cerrada correctamente");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-16">
      <button
        onClick={() => router.push("/partidos")}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Partidos
      </button>

      <div>
        <p className="text-xs text-gray-500">
          {categoria.nombre} · Jornada {partido.jornada} · {partido.sede}
        </p>
      </div>

      <Marcador
        nombreLocal={equipoLocal.nombre}
        nombreVisitante={equipoVisitante.nombre}
        golesLocal={marcador.golesLocal}
        golesVisitante={marcador.golesVisitante}
        minuto={minutoActual}
        cronometroActivo={cronometroActivo}
        puedeControlarCronometro={partido.estado !== "programado" && !actaCerrada}
        onAlternarCronometro={() => setCronometroActivo((v) => !v)}
        onAjustarMinuto={(delta) => setMinutoActual((m) => Math.max(0, m + delta))}
      />

      {mensajeToast && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {mensajeToast}
        </div>
      )}

      {partido.estado === "programado" && !actaCerrada && (
        <Boton
          onClick={() => {
            cambiarEstadoPartido(partido!.id, "en_curso");
            setCronometroActivo(true);
          }}
          disabled={partido.convocadosLocal.length === 0 || partido.convocadosVisitante.length === 0}
        >
          <Play size={16} />
          Iniciar partido
        </Boton>
      )}
      {partido.estado === "programado" &&
        (partido.convocadosLocal.length === 0 || partido.convocadosVisitante.length === 0) && (
          <p className="text-xs text-gray-500">
            Convoca al menos un jugador de cada equipo para poder iniciar el partido.
          </p>
        )}

      <Tarjeta>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <Users size={18} className="text-(--color-primary)" />
          Convocatoria
        </h2>
        <PanelConvocatoria
          nombreLocal={equipoLocal.nombre}
          nombreVisitante={equipoVisitante.nombre}
          plantelLocal={plantelLocal}
          plantelVisitante={plantelVisitante}
          convocadosLocal={partido.convocadosLocal}
          convocadosVisitante={partido.convocadosVisitante}
          soloLectura={actaCerrada}
          suspendido={suspendidoParaEstePartido}
          onCambiarLocal={(ids) => actualizarConvocados(partido!.id, "local", ids)}
          onCambiarVisitante={(ids) => actualizarConvocados(partido!.id, "visitante", ids)}
        />
      </Tarjeta>

      {!actaCerrada && (
        <Tarjeta>
          <h2 className="mb-3 font-semibold text-gray-900">Modo sin conexión</h2>
          <PanelModoOffline
            activo={modoOffline}
            sincronizando={sincronizando}
            pendientes={colaPendiente.length}
            onAlternar={alternarModoOffline}
          />
        </Tarjeta>
      )}

      {!actaCerrada && (
        <Tarjeta>
          <h2 className="mb-3 font-semibold text-gray-900">Registrar evento</h2>
          <PanelRegistrarEvento
            minutoActual={minutoActual}
            nombreLocal={equipoLocal.nombre}
            nombreVisitante={equipoVisitante.nombre}
            equipoLocalId={equipoLocal.id}
            equipoVisitanteId={equipoVisitante.id}
            convocadosLocal={convocadosLocalJugadores}
            convocadosVisitante={convocadosVisitanteJugadores}
            onRegistrar={registrarEvento}
          />
        </Tarjeta>
      )}

      <Tarjeta>
        <h2 className="mb-3 font-semibold text-gray-900">Bitácora del partido</h2>
        <FeedEventos
          eventos={eventosVisibles}
          jugadores={[...plantelLocal, ...plantelVisitante]}
          nombreEquipo={(id) => (id === equipoLocal.id ? equipoLocal.nombre : equipoVisitante.nombre)}
          puedeEliminar={!actaCerrada}
          onEliminar={manejarEliminarEvento}
        />
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <CheckCircle2 size={18} className="text-(--color-primary)" />
          Cierre de acta
        </h2>
        <PanelCierreActa
          nombreLocal={equipoLocal.nombre}
          nombreVisitante={equipoVisitante.nombre}
          confirmadoLocal={partido.confirmacionDelegadoLocal}
          confirmadoVisitante={partido.confirmacionDelegadoVisitante}
          actaCerrada={actaCerrada}
          pendientesOffline={colaPendiente.length}
          onConfirmarLocal={() => confirmarDelegado(partido!.id, "local")}
          onConfirmarVisitante={() => confirmarDelegado(partido!.id, "visitante")}
          onCerrarActa={manejarCerrarActa}
        />
      </Tarjeta>
    </div>
  );
}
