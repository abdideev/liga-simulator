"use client";

import { useState } from "react";
import { CalendarDays, Eye, MapPin, Trophy } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import { calcularEstadisticasJugadores, calcularTabla } from "@/lib/rules";

type Pestana = "calendario" | "resultados" | "posiciones" | "estadisticas";

const ESTILO_ESTADO: Record<string, string> = {
  programado: "bg-gray-100 text-gray-600",
  en_curso: "bg-(--color-warning-light) text-(--color-warning)",
  finalizado: "bg-(--color-primary-light) text-(--color-primary-dark)",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  programado: "Programado",
  en_curso: "En curso",
  finalizado: "Finalizado",
};

export default function VistaPublicaPage() {
  const { estado } = useSimulador();
  const { liga, temporadas, categorias, equipos, jugadores, partidos } = estado;
  const temporadaActiva = temporadas.find((t) => t.id === liga.temporadaActivaId);

  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [pestana, setPestana] = useState<Pestana>("calendario");

  const nombreEquipo = (id: string) => equipos.find((e) => e.id === id)?.nombre ?? "Equipo";
  const equiposCategoria = equipos.filter((e) => e.categoriaId === categoriaId);
  const jugadoresCategoria = jugadores.filter((j) =>
    equiposCategoria.some((e) => e.id === j.equipoId)
  );

  const partidosCategoria = partidos
    .filter((p) => p.categoriaId === categoriaId)
    .sort((a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha));
  const jornadas = Array.from(new Set(partidosCategoria.map((p) => p.jornada))).sort(
    (a, b) => a - b
  );
  const resultados = partidosCategoria.filter((p) => p.estado === "finalizado");

  const tabla = calcularTabla(
    equiposCategoria.map((e) => e.id),
    partidos,
    categoriaId
  );
  const estadisticas = calcularEstadisticasJugadores(jugadoresCategoria, partidos, equipos)
    .filter((e) => e.goles > 0)
    .sort((a, b) => b.goles - a.goles)
    .slice(0, 15);

  const PESTANAS: { id: Pestana; etiqueta: string }[] = [
    { id: "calendario", etiqueta: "Calendario" },
    { id: "resultados", etiqueta: "Resultados" },
    { id: "posiciones", etiqueta: "Posiciones" },
    { id: "estadisticas", etiqueta: "Goleo" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-xl border border-(--color-border) bg-white p-4 text-center">
        <Eye className="mx-auto mb-1 text-(--color-primary)" size={24} />
        <h1 className="text-lg font-bold text-gray-900">{liga.nombre}</h1>
        <p className="text-sm text-gray-600">{temporadaActiva?.nombre}</p>
      </div>

      {categorias.length === 0 ? (
        <EstadoVacio
          icono={Trophy}
          titulo="Todavía no hay información pública"
          descripcion="La liga aún no ha configurado categorías."
        />
      ) : (
        <>
          <Campo etiqueta="Categoría">
            <select
              className={claseCampo}
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPestana(p.id)}
                className={`min-h-9 flex-1 whitespace-nowrap rounded-md px-2 text-sm font-semibold transition-colors ${
                  pestana === p.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>

          {pestana === "calendario" &&
            (partidosCategoria.length === 0 ? (
              <EstadoVacio
                icono={CalendarDays}
                titulo="Sin calendario publicado"
                descripcion="El calendario de esta categoría aún no ha sido generado."
              />
            ) : (
              <div className="space-y-5">
                {jornadas.map((jornada) => (
                  <div key={jornada}>
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Jornada {jornada}
                    </h2>
                    <div className="space-y-2">
                      {partidosCategoria
                        .filter((p) => p.jornada === jornada)
                        .map((partido) => (
                          <Tarjeta key={partido.id}>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-500">
                                {partido.fecha} · {partido.hora}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_ESTADO[partido.estado]}`}
                              >
                                {ETIQUETA_ESTADO[partido.estado]}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                                {nombreEquipo(partido.equipoLocalId)}
                              </span>
                              <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-sm font-bold text-gray-800">
                                {partido.estado === "programado"
                                  ? "vs"
                                  : `${partido.golesLocal} - ${partido.golesVisitante}`}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-right font-medium text-gray-900">
                                {nombreEquipo(partido.equipoVisitanteId)}
                              </span>
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                              <MapPin size={12} />
                              {partido.sede}
                            </p>
                          </Tarjeta>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {pestana === "resultados" &&
            (resultados.length === 0 ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Todavía no hay resultados"
                descripcion="Los resultados aparecerán aquí cuando se cierren actas de partidos."
              />
            ) : (
              <div className="space-y-2">
                {resultados.map((partido) => (
                  <Tarjeta key={partido.id}>
                    <p className="text-xs text-gray-500">Jornada {partido.jornada}</p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                        {nombreEquipo(partido.equipoLocalId)}
                      </span>
                      <span className="shrink-0 rounded-md bg-gray-900 px-2 py-1 text-sm font-bold text-white">
                        {partido.golesLocal} - {partido.golesVisitante}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right font-medium text-gray-900">
                        {nombreEquipo(partido.equipoVisitanteId)}
                      </span>
                    </div>
                  </Tarjeta>
                ))}
              </div>
            ))}

          {pestana === "posiciones" &&
            (tabla.length === 0 ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Sin tabla disponible"
                descripcion="La tabla de posiciones se publicará cuando existan partidos finalizados."
              />
            ) : (
              <Tarjeta className="overflow-x-auto p-0">
                <table className="w-full min-w-[420px] text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border) text-left text-xs text-gray-500">
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Equipo</th>
                      <th className="px-2 py-2 text-center font-semibold">PJ</th>
                      <th className="px-2 py-2 text-center font-semibold">DG</th>
                      <th className="px-3 py-2 text-center font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((fila, i) => (
                      <tr key={fila.equipoId} className="border-b border-(--color-border) last:border-0">
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {nombreEquipo(fila.equipoId)}
                        </td>
                        <td className="px-2 py-2 text-center text-gray-700">{fila.partidosJugados}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{fila.diferenciaGoles}</td>
                        <td className="px-3 py-2 text-center font-bold text-gray-900">{fila.puntos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tarjeta>
            ))}

          {pestana === "estadisticas" &&
            (estadisticas.length === 0 ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Sin goleadores todavía"
                descripcion="La tabla de goleo se publicará cuando se registren goles en los partidos."
              />
            ) : (
              <div className="space-y-2">
                {estadisticas.map((e) => {
                  const jugador = jugadoresCategoria.find((j) => j.id === e.jugadorId)!;
                  return (
                    <Tarjeta key={e.jugadorId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {jugador.numero ? `#${jugador.numero} ` : ""}
                          {jugador.nombreCompleto}
                        </p>
                        <p className="text-xs text-gray-500">{nombreEquipo(jugador.equipoId)}</p>
                      </div>
                      <p className="shrink-0 text-lg font-bold text-gray-900">{e.goles}</p>
                    </Tarjeta>
                  );
                })}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
