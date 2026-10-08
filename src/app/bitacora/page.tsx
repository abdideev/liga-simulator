"use client";

import { useSimulador } from "@/context/SimuladorContext";
import type { BitacoraEntry, SimuladorState } from "@/lib/types";
import Etiqueta from "@/components/ui/Etiqueta";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { ICONO_SECCION } from "@/components/iconosSeccion";

const ETIQUETA_ROL: Record<string, string> = {
  administrador: "Administrador",
  delegado: "Delegado",
  publico: "Público",
};

function formatearFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Resolves an entry's entity references to readable names at render time. */
function describirReferencias(estado: SimuladorState, entrada: BitacoraEntry): string[] {
  const refs = entrada.referencias;
  if (!refs) return [];
  const textos: string[] = [];
  if (refs.partidoId) {
    const partido = estado.partidos.find((p) => p.id === refs.partidoId);
    if (partido) {
      const nombre = (id: string) => estado.equipos.find((e) => e.id === id)?.nombre ?? "Equipo";
      const categoria = estado.categorias.find((c) => c.id === partido.categoriaId)?.nombre;
      textos.push(
        `${categoria ? `${categoria} · ` : ""}Jornada ${partido.jornada}: ${nombre(partido.equipoLocalId)} vs ${nombre(partido.equipoVisitanteId)}`
      );
    }
  } else if (refs.equipoId) {
    const equipo = estado.equipos.find((e) => e.id === refs.equipoId);
    if (equipo) textos.push(equipo.nombre);
  } else if (refs.categoriaId) {
    const categoria = estado.categorias.find((c) => c.id === refs.categoriaId);
    if (categoria) textos.push(categoria.nombre);
  }
  return textos;
}

export default function BitacoraPage() {
  const { estado } = useSimulador();
  const entradas = [...estado.bitacora].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.bitacora}
        titulo="Bitácora"
        descripcion="Registro de auditoría de cambios en planteles, partidos y estadísticas."
      />

      {entradas.length === 0 ? (
        <EstadoVacio
          icono={ICONO_SECCION.bitacora}
          titulo="Sin actividad registrada"
          descripcion="Aquí aparecerán los cambios realizados en la liga a medida que ocurran."
        />
      ) : (
        <ol className="space-y-2" data-testid="lista-bitacora">
          {entradas.map((entrada) => (
            <li key={entrada.id}>
              <Tarjeta className="text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-ink">{entrada.accion}</span>
                  <Etiqueta>{ETIQUETA_ROL[entrada.rol] ?? entrada.rol}</Etiqueta>
                </div>
                {describirReferencias(estado, entrada).map((texto) => (
                  <p key={texto} className="mt-1 text-xs font-medium text-accent-ink">
                    {texto}
                  </p>
                ))}
                {entrada.detalle && <p className="mt-1 text-muted">{entrada.detalle}</p>}
                <p className="mt-2 text-xs text-muted/80">{formatearFecha(entrada.fecha)}</p>
              </Tarjeta>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
