"use client";

import { useState } from "react";

import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import { claseCampo } from "@/components/ui/Campo";
import {
  ETIQUETA_EVENTO,
  ICONO_EVENTO,
  TIPOS_EVENTO,
  TIPOS_QUE_REQUIEREN_JUGADOR,
} from "@/lib/eventosUtil";
import type { DatosEvento } from "@/lib/acciones";
import type { Jugador, ResultadoOperacion, TipoEvento } from "@/lib/types";

interface Props {
  minutoActual: number;
  nombreLocal: string;
  nombreVisitante: string;
  equipoLocalId: string;
  equipoVisitanteId: string;
  convocadosLocal: Jugador[];
  convocadosVisitante: Jugador[];
  onRegistrar: (evento: DatosEvento) => ResultadoOperacion;
}

function OpcionesJugador({ jugadores }: { jugadores: Jugador[] }) {
  return (
    <>
      {jugadores.map((j) => (
        <option key={j.id} value={j.id}>
          {j.numero ? `#${j.numero} ` : ""}
          {j.nombreCompleto}
        </option>
      ))}
    </>
  );
}

export default function PanelRegistrarEvento({
  minutoActual,
  nombreLocal,
  nombreVisitante,
  equipoLocalId,
  equipoVisitanteId,
  convocadosLocal,
  convocadosVisitante,
  onRegistrar,
}: Props) {
  const [tipo, setTipo] = useState<TipoEvento | null>(null);
  const [equipoId, setEquipoId] = useState<string>("");
  const [jugadorId, setJugadorId] = useState<string>("");
  const [jugadorEntraId, setJugadorEntraId] = useState<string>("");
  const [minuto, setMinuto] = useState(minutoActual);
  const [error, setError] = useState<string | null>(null);

  const plantelEquipo = equipoId === equipoLocalId ? convocadosLocal : convocadosVisitante;
  const requiereJugador = tipo ? TIPOS_QUE_REQUIEREN_JUGADOR.includes(tipo) : false;
  const esSustitucion = tipo === "sustitucion";

  function reiniciarSeleccion() {
    setTipo(null);
    setEquipoId("");
    setJugadorId("");
    setJugadorEntraId("");
    setError(null);
  }

  function elegirTipo(nuevoTipo: TipoEvento) {
    reiniciarSeleccion();
    setTipo(nuevoTipo);
    setMinuto(minutoActual);
  }

  function elegirEquipo(id: string) {
    setEquipoId(id);
    setJugadorId("");
    setJugadorEntraId("");
  }

  function confirmar() {
    if (!tipo || !equipoId) return;
    const resultado = onRegistrar({
      minuto,
      tipo,
      equipoId,
      jugadorId: jugadorId || undefined,
      jugadorEntraId: esSustitucion ? jugadorEntraId : undefined,
    });
    if (!resultado.ok) {
      setError(resultado.motivo ?? "No se pudo registrar el evento");
      return;
    }
    reiniciarSeleccion();
  }

  const puedeConfirmar =
    !!tipo &&
    !!equipoId &&
    (!requiereJugador || !!jugadorId) &&
    (!esSustitucion || (!!jugadorId && !!jugadorEntraId && jugadorId !== jugadorEntraId));

  const claseEquipo = (activo: boolean) =>
    `min-h-11 truncate rounded-lg border px-2 text-sm font-semibold transition-colors ${
      activo ? "border-accent bg-accent-soft text-accent-ink" : "border-border bg-paper text-ink hover:bg-surface"
    }`;

  return (
    <div className="space-y-3" data-testid="panel-registrar-evento">
      <div className="grid grid-cols-4 gap-2">
        {TIPOS_EVENTO.map((t) => {
          const Icono = ICONO_EVENTO[t];
          const activo = tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => elegirTipo(t)}
              data-testid={`tipo-evento-${t}`}
              aria-pressed={activo}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium leading-tight transition-colors ${
                activo
                  ? "border-accent bg-accent-soft text-accent-ink"
                  : "border-border bg-paper text-ink hover:bg-surface"
              }`}
            >
              <Icono size={18} />
              <span className="text-center">{ETIQUETA_EVENTO[t]}</span>
            </button>
          );
        })}
      </div>

      {tipo && (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{ETIQUETA_EVENTO[tipo]}</p>
            <label className="flex items-center gap-2 text-sm text-muted">
              Minuto
              <input
                type="number"
                min={0}
                max={130}
                value={minuto}
                onChange={(e) => setMinuto(Number(e.target.value))}
                className="w-16 rounded-md border border-border bg-paper px-2 py-1 text-center text-ink"
                data-testid="campo-minuto-evento"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => elegirEquipo(equipoLocalId)}
              className={claseEquipo(equipoId === equipoLocalId)}
              data-testid="evento-equipo-local"
            >
              {nombreLocal}
            </button>
            <button
              type="button"
              onClick={() => elegirEquipo(equipoVisitanteId)}
              className={claseEquipo(equipoId === equipoVisitanteId)}
              data-testid="evento-equipo-visitante"
            >
              {nombreVisitante}
            </button>
          </div>

          {equipoId && !esSustitucion && (
            <select
              className={`${claseCampo} bg-paper`}
              value={jugadorId}
              onChange={(e) => setJugadorId(e.target.value)}
              data-testid="evento-jugador"
            >
              <option value="">{requiereJugador ? "Selecciona jugador" : "Jugador (opcional)"}</option>
              <OpcionesJugador jugadores={plantelEquipo} />
            </select>
          )}

          {equipoId && esSustitucion && (
            <div className="grid grid-cols-1 gap-2">
              <select
                className={`${claseCampo} bg-paper`}
                value={jugadorId}
                onChange={(e) => setJugadorId(e.target.value)}
                data-testid="evento-jugador-sale"
              >
                <option value="">Sale</option>
                <OpcionesJugador jugadores={plantelEquipo} />
              </select>
              <select
                className={`${claseCampo} bg-paper`}
                value={jugadorEntraId}
                onChange={(e) => setJugadorEntraId(e.target.value)}
                data-testid="evento-jugador-entra"
              >
                <option value="">Entra</option>
                <OpcionesJugador jugadores={plantelEquipo.filter((j) => j.id !== jugadorId)} />
              </select>
            </div>
          )}

          {error && <Aviso intencion="danger">{error}</Aviso>}

          <div className="flex gap-2">
            <Boton onClick={confirmar} disabled={!puedeConfirmar} data-testid="boton-registrar-evento">
              Registrar
            </Boton>
            <Boton intencion="neutral" variante="contorno" onClick={reiniciarSeleccion}>
              Cancelar
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
