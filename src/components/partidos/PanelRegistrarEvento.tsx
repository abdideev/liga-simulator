"use client";

import { useState } from "react";

import Boton from "@/components/ui/Boton";
import { claseCampo } from "@/components/ui/Campo";
import {
  ETIQUETA_EVENTO,
  ICONO_EVENTO,
  TIPOS_EVENTO,
  TIPOS_QUE_REQUIEREN_JUGADOR,
} from "@/lib/eventosUtil";
import type { EventoPartido, Jugador, TipoEvento } from "@/lib/types";

interface Props {
  minutoActual: number;
  nombreLocal: string;
  nombreVisitante: string;
  equipoLocalId: string;
  equipoVisitanteId: string;
  convocadosLocal: Jugador[];
  convocadosVisitante: Jugador[];
  onRegistrar: (evento: Omit<EventoPartido, "id" | "partidoId">) => void;
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

  const plantelEquipo = equipoId === equipoLocalId ? convocadosLocal : convocadosVisitante;
  const requiereJugador = tipo ? TIPOS_QUE_REQUIEREN_JUGADOR.includes(tipo) : false;
  const esSustitucion = tipo === "sustitucion";

  function reiniciarSeleccion() {
    setTipo(null);
    setEquipoId("");
    setJugadorId("");
    setJugadorEntraId("");
  }

  function elegirTipo(nuevoTipo: TipoEvento) {
    setTipo(nuevoTipo);
    setEquipoId("");
    setJugadorId("");
    setJugadorEntraId("");
    setMinuto(minutoActual);
  }

  function confirmar() {
    if (!tipo || !equipoId) return;
    if (requiereJugador && !jugadorId) return;
    if (esSustitucion && (!jugadorId || !jugadorEntraId)) return;

    onRegistrar({
      minuto,
      tipo,
      equipoId,
      jugadorId: jugadorId || undefined,
      jugadorEntraId: esSustitucion ? jugadorEntraId : undefined,
    });
    reiniciarSeleccion();
  }

  const puedeConfirmar =
    !!tipo &&
    !!equipoId &&
    (!requiereJugador || !!jugadorId) &&
    (!esSustitucion || (!!jugadorId && !!jugadorEntraId && jugadorId !== jugadorEntraId));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {TIPOS_EVENTO.map((t) => {
          const Icono = ICONO_EVENTO[t];
          const activo = tipo === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => elegirTipo(t)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium leading-tight ${
                activo
                  ? "border-(--color-primary) bg-(--color-primary-light) text-(--color-primary-dark)"
                  : "border-(--color-border) bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icono size={18} />
              <span className="text-center">{ETIQUETA_EVENTO[t]}</span>
            </button>
          );
        })}
      </div>

      {tipo && (
        <div className="space-y-3 rounded-lg border border-(--color-border) bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">{ETIQUETA_EVENTO[tipo]}</p>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Minuto
              <input
                type="number"
                min={0}
                max={130}
                value={minuto}
                onChange={(e) => setMinuto(Number(e.target.value))}
                className="w-16 rounded-md border border-(--color-border) px-2 py-1 text-center"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEquipoId(equipoLocalId);
                setJugadorId("");
                setJugadorEntraId("");
              }}
              className={`min-h-11 truncate rounded-lg border px-2 text-sm font-semibold ${
                equipoId === equipoLocalId
                  ? "border-(--color-primary) bg-(--color-primary-light) text-(--color-primary-dark)"
                  : "border-(--color-border) bg-white text-gray-700"
              }`}
            >
              {nombreLocal}
            </button>
            <button
              type="button"
              onClick={() => {
                setEquipoId(equipoVisitanteId);
                setJugadorId("");
                setJugadorEntraId("");
              }}
              className={`min-h-11 truncate rounded-lg border px-2 text-sm font-semibold ${
                equipoId === equipoVisitanteId
                  ? "border-(--color-primary) bg-(--color-primary-light) text-(--color-primary-dark)"
                  : "border-(--color-border) bg-white text-gray-700"
              }`}
            >
              {nombreVisitante}
            </button>
          </div>

          {equipoId && !esSustitucion && (
            <select
              className={claseCampo}
              value={jugadorId}
              onChange={(e) => setJugadorId(e.target.value)}
            >
              <option value="">
                {requiereJugador ? "Selecciona jugador" : "Jugador (opcional)"}
              </option>
              {plantelEquipo.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.numero ? `#${j.numero} ` : ""}
                  {j.nombreCompleto}
                </option>
              ))}
            </select>
          )}

          {equipoId && esSustitucion && (
            <div className="grid grid-cols-1 gap-2">
              <select
                className={claseCampo}
                value={jugadorId}
                onChange={(e) => setJugadorId(e.target.value)}
              >
                <option value="">Sale</option>
                {plantelEquipo.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.numero ? `#${j.numero} ` : ""}
                    {j.nombreCompleto}
                  </option>
                ))}
              </select>
              <select
                className={claseCampo}
                value={jugadorEntraId}
                onChange={(e) => setJugadorEntraId(e.target.value)}
              >
                <option value="">Entra</option>
                {plantelEquipo
                  .filter((j) => j.id !== jugadorId)
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.numero ? `#${j.numero} ` : ""}
                      {j.nombreCompleto}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <Boton onClick={confirmar} disabled={!puedeConfirmar}>
              Registrar
            </Boton>
            <Boton variante="secundario" onClick={reiniciarSeleccion}>
              Cancelar
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
