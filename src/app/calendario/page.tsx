"use client";

import { useState } from "react";
import { CalendarDays, MapPin, RefreshCw } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function nombreEquipo(equipos: { id: string; nombre: string }[], id: string): string {
  return equipos.find((e) => e.id === id)?.nombre ?? "Equipo desconocido";
}

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

export default function CalendarioPage() {
  const { estado, generarCalendarioCategoria } = useSimulador();
  const { categorias, equipos, partidos, rolActual } = estado;
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [fechaInicio, setFechaInicio] = useState(fechaHoy());
  const [mostrarGenerador, setMostrarGenerador] = useState(false);

  const categoria = categorias.find((c) => c.id === categoriaId);
  const equiposCategoria = equipos.filter((e) => e.categoriaId === categoriaId);
  const partidosCategoria = partidos
    .filter((p) => p.categoriaId === categoriaId)
    .sort((a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha));

  const jornadas = Array.from(new Set(partidosCategoria.map((p) => p.jornada))).sort(
    (a, b) => a - b
  );

  function manejarGenerar() {
    generarCalendarioCategoria(categoriaId, {
      fechaInicio,
      diasEntreJornadas: 7,
      horaDefault: "17:00",
      sedes: [
        "Unidad Deportiva Tlahuelilpan",
        "Campo Municipal No. 2",
        "Cancha Ejido La Providencia",
      ],
    });
    setMostrarGenerador(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <CalendarDays className="text-(--color-primary)" size={22} />
          Calendario
        </h1>
        <p className="text-sm text-gray-600">
          Consulta el calendario por jornada o genera uno nuevo (todos contra todos) para una
          categoría.
        </p>
      </div>

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

      {rolActual === "administrador" && (
        <Tarjeta>
          {mostrarGenerador ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Se generará un calendario de todos contra todos para {equiposCategoria.length}{" "}
                equipos de {categoria?.nombre}. Los partidos programados existentes de esta
                categoría se reemplazarán; los partidos ya iniciados o finalizados se conservan.
              </p>
              <Campo etiqueta="Fecha de la jornada 1">
                <input
                  type="date"
                  className={claseCampo}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </Campo>
              <div className="flex gap-2">
                <Boton
                  onClick={manejarGenerar}
                  disabled={equiposCategoria.length < 2}
                >
                  <RefreshCw size={16} />
                  Generar calendario
                </Boton>
                <Boton variante="secundario" onClick={() => setMostrarGenerador(false)}>
                  Cancelar
                </Boton>
              </div>
              {equiposCategoria.length < 2 && (
                <p className="text-sm font-medium text-(--color-danger)">
                  Se necesitan al menos 2 equipos registrados en esta categoría.
                </p>
              )}
            </div>
          ) : (
            <Boton variante="secundario" onClick={() => setMostrarGenerador(true)}>
              <RefreshCw size={16} />
              Generar calendario para {categoria?.nombre ?? "esta categoría"}
            </Boton>
          )}
        </Tarjeta>
      )}

      {partidosCategoria.length === 0 ? (
        <EstadoVacio
          icono={CalendarDays}
          titulo="Todavía no hay calendario"
          descripcion="Genera el calendario de todos contra todos para esta categoría desde el botón de arriba."
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
                          {nombreEquipo(equipos, partido.equipoLocalId)}
                        </span>
                        <span className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-sm font-bold text-gray-800">
                          {partido.estado === "programado"
                            ? "vs"
                            : `${partido.golesLocal} - ${partido.golesVisitante}`}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-right font-medium text-gray-900">
                          {nombreEquipo(equipos, partido.equipoVisitanteId)}
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
      )}
    </div>
  );
}
