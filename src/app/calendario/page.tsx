"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { fechaHoy } from "@/lib/fechas";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import TarjetaPartido from "@/components/partidos/TarjetaPartido";

const SEDES = [
  "Unidad Deportiva Tlahuelilpan",
  "Campo Municipal No. 2",
  "Cancha Ejido La Providencia",
];

export default function CalendarioPage() {
  const { estado, despachar } = useSimulador();
  const { categorias, equipos, partidos, rolActual } = estado;
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [fechaInicio, setFechaInicio] = useState(fechaHoy);
  const [mostrarGenerador, setMostrarGenerador] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hoy = fechaHoy();

  const nombreEquipo = (id: string) => equipos.find((e) => e.id === id)?.nombre ?? "Equipo desconocido";
  const categoria = categorias.find((c) => c.id === categoriaId);
  const equiposCategoria = equipos.filter((e) => e.categoriaId === categoriaId);
  const partidosCategoria = partidos
    .filter((p) => p.categoriaId === categoriaId)
    .sort((a, b) => a.jornada - b.jornada || a.fecha.localeCompare(b.fecha));

  const jornadas = Array.from(new Set(partidosCategoria.map((p) => p.jornada))).sort(
    (a, b) => a - b
  );
  const idsConPartido = (jornada: number) =>
    new Set(
      partidosCategoria
        .filter((p) => p.jornada === jornada)
        .flatMap((p) => [p.equipoLocalId, p.equipoVisitanteId])
    );

  function manejarGenerar() {
    const resultado = despachar({
      tipo: "generarCalendario",
      categoriaId,
      opciones: { fechaInicio, diasEntreJornadas: 7, horaDefault: "17:00", sedes: SEDES },
    });
    if (!resultado.ok) {
      setError(resultado.motivo ?? "No se pudo generar el calendario");
      return;
    }
    setError(null);
    setMostrarGenerador(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.calendario}
        titulo="Calendario"
        descripcion="Consulta el calendario por jornada o genera uno nuevo (todos contra todos) para una categoría."
      />

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

      {rolActual === "administrador" && (
        <Tarjeta>
          {mostrarGenerador ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
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
              {error && <Aviso intencion="danger">{error}</Aviso>}
              <div className="flex gap-2">
                <Boton onClick={manejarGenerar} data-testid="boton-generar-calendario">
                  <RefreshCw size={16} />
                  Generar calendario
                </Boton>
                <Boton
                  intencion="neutral"
                  variante="contorno"
                  onClick={() => setMostrarGenerador(false)}
                >
                  Cancelar
                </Boton>
              </div>
            </div>
          ) : (
            <Boton variante="suave" onClick={() => setMostrarGenerador(true)}>
              <RefreshCw size={16} />
              Generar calendario para {categoria?.nombre ?? "esta categoría"}
            </Boton>
          )}
        </Tarjeta>
      )}

      {partidosCategoria.length === 0 ? (
        <EstadoVacio
          icono={ICONO_SECCION.calendario}
          titulo="Todavía no hay calendario"
          descripcion="Genera el calendario de todos contra todos para esta categoría desde el botón de arriba."
        />
      ) : (
        <div className="space-y-6">
          {jornadas.map((jornada) => {
            const conPartido = idsConPartido(jornada);
            const descansan = equiposCategoria.filter((e) => !conPartido.has(e.id));
            return (
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
                    />
                  ))}
                {descansan.length > 0 && (
                  <p className="text-xs text-muted">
                    Descansa: {descansan.map((e) => e.nombre).join(", ")}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
