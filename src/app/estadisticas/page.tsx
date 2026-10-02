"use client";

import { useState } from "react";
import { BarChart3, ShieldAlert, Trophy } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import { calcularEstadisticasJugadores, calcularTabla } from "@/lib/rules";

type Pestana = "posiciones" | "estadisticas" | "suspendidos";

export default function EstadisticasPage() {
  const { estado } = useSimulador();
  const { categorias, equipos, jugadores, partidos } = estado;
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [pestana, setPestana] = useState<Pestana>("posiciones");

  const equiposCategoria = equipos.filter((e) => e.categoriaId === categoriaId);
  const jugadoresCategoria = jugadores.filter((j) =>
    equiposCategoria.some((e) => e.id === j.equipoId)
  );
  const nombreEquipo = (id: string) => equipos.find((e) => e.id === id)?.nombre ?? "Equipo";

  const tabla = calcularTabla(
    equiposCategoria.map((e) => e.id),
    partidos,
    categoriaId
  );
  const estadisticas = calcularEstadisticasJugadores(jugadoresCategoria, partidos, equipos)
    .filter((e) => e.goles > 0 || e.tarjetasAmarillas > 0 || e.tarjetasRojas > 0 || e.partidosJugados > 0)
    .sort((a, b) => b.goles - a.goles || b.tarjetasAmarillas - a.tarjetasAmarillas);
  const suspendidos = calcularEstadisticasJugadores(jugadoresCategoria, partidos, equipos).filter(
    (e) => e.suspendido
  );

  const PESTANAS: { id: Pestana; etiqueta: string }[] = [
    { id: "posiciones", etiqueta: "Posiciones" },
    { id: "estadisticas", etiqueta: "Estadísticas" },
    { id: "suspendidos", etiqueta: "Suspendidos" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Trophy className="text-(--color-primary)" size={22} />
          Tabla y estadísticas
        </h1>
        <p className="text-sm text-gray-600">
          Posiciones, goleo, tarjetas y suspensiones calculadas automáticamente.
        </p>
      </div>

      {categorias.length === 0 ? (
        <EstadoVacio
          icono={BarChart3}
          titulo="No hay categorías configuradas"
          descripcion="Crea una categoría y registra equipos para ver estadísticas."
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

          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPestana(p.id)}
                className={`min-h-9 flex-1 rounded-md text-sm font-semibold transition-colors ${
                  pestana === p.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>

          {pestana === "posiciones" &&
            (tabla.length === 0 ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Sin partidos finalizados"
                descripcion="La tabla se llenará automáticamente cuando se cierren actas de partidos de esta categoría."
              />
            ) : (
              <Tarjeta className="overflow-x-auto p-0">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-(--color-border) text-left text-xs text-gray-500">
                      <th className="px-3 py-2 font-semibold">#</th>
                      <th className="px-3 py-2 font-semibold">Equipo</th>
                      <th className="px-2 py-2 text-center font-semibold">PJ</th>
                      <th className="px-2 py-2 text-center font-semibold">G</th>
                      <th className="px-2 py-2 text-center font-semibold">E</th>
                      <th className="px-2 py-2 text-center font-semibold">P</th>
                      <th className="px-2 py-2 text-center font-semibold">GF</th>
                      <th className="px-2 py-2 text-center font-semibold">GC</th>
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
                        <td className="px-2 py-2 text-center text-gray-700">{fila.ganados}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{fila.empatados}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{fila.perdidos}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{fila.golesFavor}</td>
                        <td className="px-2 py-2 text-center text-gray-700">{fila.golesContra}</td>
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
                icono={BarChart3}
                titulo="Sin estadísticas todavía"
                descripcion="Los goles y tarjetas aparecerán aquí cuando se capturen eventos en los partidos."
              />
            ) : (
              <div className="space-y-2">
                {estadisticas.map((e) => {
                  const jugador = jugadoresCategoria.find((j) => j.id === e.jugadorId)!;
                  return (
                    <Tarjeta key={e.jugadorId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {jugador.nombreCompleto}
                        </p>
                        <p className="text-xs text-gray-500">
                          {nombreEquipo(jugador.equipoId)} · {e.partidosJugados} PJ
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-3 text-center text-sm">
                        <div>
                          <p className="font-bold text-gray-900">{e.goles}</p>
                          <p className="text-[10px] text-gray-500">Goles</p>
                        </div>
                        <div>
                          <p className="font-bold text-amber-500">{e.tarjetasAmarillas}</p>
                          <p className="text-[10px] text-gray-500">Amar.</p>
                        </div>
                        <div>
                          <p className="font-bold text-(--color-danger)">{e.tarjetasRojas}</p>
                          <p className="text-[10px] text-gray-500">Rojas</p>
                        </div>
                      </div>
                    </Tarjeta>
                  );
                })}
              </div>
            ))}

          {pestana === "suspendidos" &&
            (suspendidos.length === 0 ? (
              <EstadoVacio
                icono={ShieldAlert}
                titulo="No hay jugadores suspendidos"
                descripcion="Cuando un jugador acumule 5 tarjetas amarillas o reciba una tarjeta roja, aparecerá aquí con el motivo de su suspensión."
              />
            ) : (
              <div className="space-y-2">
                {suspendidos.map((e) => {
                  const jugador = jugadoresCategoria.find((j) => j.id === e.jugadorId)!;
                  return (
                    <Tarjeta
                      key={e.jugadorId}
                      className="flex items-center gap-3 border-(--color-danger)"
                    >
                      <ShieldAlert size={20} className="shrink-0 text-(--color-danger)" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {jugador.nombreCompleto}
                        </p>
                        <p className="text-xs text-gray-500">{nombreEquipo(jugador.equipoId)}</p>
                        <p className="text-xs font-medium text-(--color-danger)">
                          {e.motivoSuspension}
                        </p>
                      </div>
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
