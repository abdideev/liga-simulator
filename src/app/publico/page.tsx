"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { fechaHoy } from "@/lib/fechas";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import Pestanas from "@/components/ui/Pestanas";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import TarjetaPartido from "@/components/partidos/TarjetaPartido";
import { calcularEstadisticasJugadores, calcularTabla } from "@/lib/rules";

type Pestana = "calendario" | "resultados" | "posiciones" | "goleo";

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "calendario", etiqueta: "Calendario" },
  { id: "resultados", etiqueta: "Resultados" },
  { id: "posiciones", etiqueta: "Posiciones" },
  { id: "goleo", etiqueta: "Goleo" },
];

/**
 * Public view (RF-19). By design it never renders personal data: no CURP,
 * birth date, age, guardian, eligibility or contact details — only team
 * names, results and players' names/shirt numbers in the scorer list.
 */
export default function VistaPublicaPage() {
  const { estado } = useSimulador();
  const { liga, temporadas, categorias, equipos, jugadores, partidos } = estado;
  const temporadaActiva = temporadas.find((t) => t.id === liga.temporadaActivaId);
  const hoy = fechaHoy();

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
  const goleo = calcularEstadisticasJugadores(jugadoresCategoria, partidos)
    .filter((e) => e.goles > 0)
    .sort((a, b) => b.goles - a.goles)
    .slice(0, 15);

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="vista-publica">
      <EncabezadoPagina
        icono={ICONO_SECCION.publico}
        titulo={liga.nombre}
        descripcion={temporadaActiva?.nombre}
      />

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

          {pestana === "calendario" &&
            (partidosCategoria.length === 0 ? (
              <EstadoVacio
                icono={ICONO_SECCION.calendario}
                titulo="Sin calendario publicado"
                descripcion="El calendario de esta categoría aún no ha sido generado."
              />
            ) : (
              <div className="space-y-6">
                {jornadas.map((jornada) => (
                  <section key={jornada} className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Jornada {jornada}
                    </h2>
                    {partidosCategoria
                      .filter((p) => p.jornada === jornada)
                      .map((partido) => (
                        <TarjetaPartido
                          key={partido.id}
                          partido={partido}
                          nombreEquipo={nombreEquipo}
                          hoy={hoy}
                          mostrarProtesta={false}
                        />
                      ))}
                  </section>
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
                    <p className="text-xs text-muted">Jornada {partido.jornada}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="min-w-0 flex-1 truncate font-medium text-ink">
                        {nombreEquipo(partido.equipoLocalId)}
                      </span>
                      <span className="shrink-0 rounded-xl bg-ink px-3 py-1 text-sm font-semibold tabular-nums text-paper">
                        {partido.golesLocal} - {partido.golesVisitante}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right font-medium text-ink">
                        {nombreEquipo(partido.equipoVisitanteId)}
                      </span>
                    </div>
                  </Tarjeta>
                ))}
              </div>
            ))}

          {pestana === "posiciones" &&
            (resultados.length === 0 ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Sin tabla disponible"
                descripcion="La tabla de posiciones se publicará cuando existan partidos finalizados."
              />
            ) : (
              <div className="overflow-x-auto rounded-3xl bg-paper shadow-suave">
                <table className="w-full min-w-[380px] text-sm">
                  <thead>
                    <tr className="bg-canvas text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Equipo</th>
                      <th className="px-2 py-3 text-center font-semibold">PJ</th>
                      <th className="px-2 py-3 text-center font-semibold">DG</th>
                      <th className="px-4 py-3 text-center font-semibold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.map((fila, i) => (
                      <tr key={fila.equipoId} className="border-b border-canvas transition-colors last:border-0 hover:bg-canvas/60">
                        <td className="px-4 py-3 text-muted">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-ink">{nombreEquipo(fila.equipoId)}</td>
                        <td className="px-2 py-3 text-center tabular-nums text-muted">{fila.partidosJugados}</td>
                        <td className="px-2 py-3 text-center tabular-nums text-muted">{fila.diferenciaGoles}</td>
                        <td className="px-4 py-3 text-center font-semibold tabular-nums text-ink">{fila.puntos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {pestana === "goleo" &&
            (goleo.length === 0 ? (
              <EstadoVacio
                icono={Trophy}
                titulo="Sin goleadores todavía"
                descripcion="La tabla de goleo se publicará cuando se registren goles en los partidos."
              />
            ) : (
              <div className="space-y-2">
                {goleo.map((e) => {
                  const jugador = jugadoresCategoria.find((j) => j.id === e.jugadorId)!;
                  return (
                    <Tarjeta key={e.jugadorId} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {jugador.numero ? `#${jugador.numero} ` : ""}
                          {jugador.nombreCompleto}
                        </p>
                        <p className="text-xs text-muted">{nombreEquipo(jugador.equipoId)}</p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold tabular-nums text-ink">{e.goles}</p>
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
