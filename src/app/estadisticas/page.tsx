"use client";

import { useState } from "react";
import { ShieldAlert, Trophy } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import Pestanas from "@/components/ui/Pestanas";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import { calcularEstadisticasJugadores, calcularTabla } from "@/lib/rules";

type Pestana = "posiciones" | "estadisticas" | "suspendidos";

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "posiciones", etiqueta: "Posiciones" },
  { id: "estadisticas", etiqueta: "Estadísticas" },
  { id: "suspendidos", etiqueta: "Suspendidos" },
];

const COLUMNAS_TABLA = ["PJ", "G", "E", "P", "GF", "GC", "DG"] as const;

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
  const hayFinalizados = partidos.some(
    (p) => p.categoriaId === categoriaId && p.estado === "finalizado"
  );

  const tabla = calcularTabla(
    equiposCategoria.map((e) => e.id),
    partidos,
    categoriaId
  );
  const todas = calcularEstadisticasJugadores(jugadoresCategoria, partidos);
  const estadisticas = todas
    .filter((e) => e.goles > 0 || e.tarjetasAmarillas > 0 || e.tarjetasRojas > 0 || e.partidosJugados > 0)
    .sort((a, b) => b.goles - a.goles || b.tarjetasAmarillas - a.tarjetasAmarillas);
  const suspendidos = todas.filter((e) => e.suspendido);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.estadisticas}
        titulo="Tabla y estadísticas"
        descripcion="Posiciones, goleo, tarjetas y suspensiones calculadas automáticamente a partir de las actas cerradas."
      />

      {categorias.length === 0 ? (
        <EstadoVacio
          icono={ICONO_SECCION.estadisticas}
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
              data-testid="selector-categoria"
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Pestanas opciones={PESTANAS} valor={pestana} onCambiar={setPestana} />

          {pestana === "posiciones" &&
            (!hayFinalizados ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Sin partidos finalizados"
                descripcion="La tabla se llenará automáticamente cuando se cierren actas de partidos de esta categoría."
              />
            ) : (
              <div className="overflow-x-auto rounded-3xl bg-paper shadow-suave" data-testid="tabla-posiciones">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Equipo</th>
                      {COLUMNAS_TABLA.map((c) => (
                        <th key={c} className="px-2 py-3 text-center font-semibold">
                          {c}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((fila, i) => (
                      <tr key={fila.equipoId} className="border-b border-canvas transition-colors last:border-0 hover:bg-canvas/60">
                        <td className="px-4 py-3 text-muted">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-ink">{nombreEquipo(fila.equipoId)}</td>
                        {[
                          fila.partidosJugados,
                          fila.ganados,
                          fila.empatados,
                          fila.perdidos,
                          fila.golesFavor,
                          fila.golesContra,
                          fila.diferenciaGoles,
                        ].map((valor, j) => (
                          <td key={j} className="px-2 py-3 text-center tabular-nums text-muted">
                            {valor}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center font-semibold tabular-nums text-ink">
                          {fila.puntos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {pestana === "estadisticas" &&
            (estadisticas.length === 0 ? (
              <EstadoVacio
                icono={ICONO_SECCION.estadisticas}
                titulo="Sin estadísticas todavía"
                descripcion="Los goles y tarjetas aparecerán aquí cuando se cierren actas con eventos."
              />
            ) : (
              <div className="space-y-2">
                {estadisticas.map((e) => {
                  const jugador = jugadoresCategoria.find((j) => j.id === e.jugadorId)!;
                  return (
                    <Tarjeta key={e.jugadorId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{jugador.nombreCompleto}</p>
                        <p className="text-xs text-muted">
                          {nombreEquipo(jugador.equipoId)} · {e.partidosJugados} PJ
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-4 text-center text-sm">
                        <div>
                          <p className="font-semibold tabular-nums text-ink">{e.goles}</p>
                          <p className="text-[10px] text-muted">Goles</p>
                        </div>
                        <div>
                          <p className="font-semibold tabular-nums text-warn-ink">{e.tarjetasAmarillas}</p>
                          <p className="text-[10px] text-muted">Amar.</p>
                        </div>
                        <div>
                          <p className="font-semibold tabular-nums text-danger-ink">{e.tarjetasRojas}</p>
                          <p className="text-[10px] text-muted">Rojas</p>
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
                descripcion="Cuando un jugador acumule 5 tarjetas amarillas o reciba una tarjeta roja, aparecerá aquí hasta que cumpla su suspensión en el siguiente partido de su equipo."
              />
            ) : (
              <div className="space-y-2" data-testid="lista-suspendidos">
                {suspendidos.map((e) => {
                  const jugador = jugadoresCategoria.find((j) => j.id === e.jugadorId)!;
                  return (
                    <Tarjeta key={e.jugadorId} className="flex items-center gap-3 ring-1 ring-danger/15">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger-ink">
                        <ShieldAlert size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{jugador.nombreCompleto}</p>
                        <p className="text-xs text-muted">{nombreEquipo(jugador.equipoId)}</p>
                        <p className="text-xs font-medium text-danger-ink">
                          {e.motivoSuspension} · cumple en el siguiente partido de su equipo
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
