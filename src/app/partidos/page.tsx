"use client";

import { useState } from "react";
import Link from "next/link";

import { useSimulador } from "@/context/SimuladorContext";
import { fechaHoy } from "@/lib/fechas";
import Campo, { claseCampo } from "@/components/ui/Campo";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import TarjetaPartido from "@/components/partidos/TarjetaPartido";

export default function ListaPartidosPage() {
  const { estado } = useSimulador();
  const { categorias, equipos, partidos } = estado;
  const [categoriaId, setCategoriaId] = useState<string>("todas");
  const hoy = fechaHoy();

  const nombreEquipo = (id: string) => equipos.find((e) => e.id === id)?.nombre ?? "Equipo";

  const filtrados = partidos
    .filter((p) => categoriaId === "todas" || p.categoriaId === categoriaId)
    .sort((a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.partidos}
        titulo="Partidos"
        descripcion="Selecciona un partido para abrir la mesa de control y capturar el acta."
      />

      <Campo etiqueta="Categoría">
        <select
          className={claseCampo}
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          data-testid="selector-categoria"
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
          icono={ICONO_SECCION.partidos}
          titulo="No hay partidos"
          descripcion="Genera un calendario desde la sección Calendario para poder capturar partidos."
        />
      ) : (
        <div className="space-y-2">
          {filtrados.map((partido) => (
            <Link key={partido.id} href={`/partidos/${partido.id}`} className="block">
              <TarjetaPartido
                partido={partido}
                nombreEquipo={nombreEquipo}
                hoy={hoy}
                mostrarJornada
                interactiva
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
