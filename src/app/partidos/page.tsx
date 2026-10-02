"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, MapPin } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";

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

export default function ListaPartidosPage() {
  const { estado } = useSimulador();
  const { categorias, equipos, partidos } = estado;
  const [categoriaId, setCategoriaId] = useState<string>("todas");

  const nombreEquipo = (id: string) => equipos.find((e) => e.id === id)?.nombre ?? "Equipo";

  const filtrados = partidos
    .filter((p) => categoriaId === "todas" || p.categoriaId === categoriaId)
    .sort((a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <ClipboardList className="text-(--color-primary)" size={22} />
          Partidos
        </h1>
        <p className="text-sm text-gray-600">
          Selecciona un partido para abrir la mesa de control y capturar el acta.
        </p>
      </div>

      <Campo etiqueta="Categoría">
        <select
          className={claseCampo}
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </Campo>

      {filtrados.length === 0 ? (
        <EstadoVacio
          icono={ClipboardList}
          titulo="No hay partidos"
          descripcion="Genera un calendario desde la sección Calendario para poder capturar partidos."
        />
      ) : (
        <div className="space-y-2">
          {filtrados.map((partido) => (
            <Link key={partido.id} href={`/partidos/${partido.id}`}>
              <Tarjeta className="transition-colors hover:border-(--color-primary)">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Jornada {partido.jornada} · {partido.fecha} {partido.hora}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
