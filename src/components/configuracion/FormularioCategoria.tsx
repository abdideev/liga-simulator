"use client";

import { useState } from "react";

import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import type { DatosCategoria } from "@/lib/acciones";
import type { Categoria, ResultadoOperacion } from "@/lib/types";

export type { DatosCategoria };

export default function FormularioCategoria({
  valorInicial,
  onGuardar,
  onCancelar,
}: {
  valorInicial?: Categoria;
  onGuardar: (datos: DatosCategoria) => ResultadoOperacion;
  onCancelar?: () => void;
}) {
  const [anioActual] = useState(() => new Date().getFullYear());
  const [nombre, setNombre] = useState(valorInicial?.nombre ?? "");
  const [anioMin, setAnioMin] = useState(valorInicial?.anioNacimientoMin ?? anioActual - 45);
  const [anioMax, setAnioMax] = useState(valorInicial?.anioNacimientoMax ?? anioActual - 18);
  const [cupo, setCupo] = useState(valorInicial?.cupoEquipos ?? 8);
  const [limite, setLimite] = useState(valorInicial?.limiteJugadoresPorPlantel ?? 20);
  const [error, setError] = useState<string | null>(null);

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    const resultado = onGuardar({
      nombre: nombre.trim(),
      anioNacimientoMin: anioMin,
      anioNacimientoMax: anioMax,
      cupoEquipos: cupo,
      limiteJugadoresPorPlantel: limite,
    });
    setError(resultado.ok ? null : (resultado.motivo ?? "No se pudo guardar la categoría"));
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-4" data-testid="formulario-categoria">
      <Campo etiqueta="Nombre de la categoría">
        <input
          className={claseCampo}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Libre, Juvenil Sub-17"
        />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Año de nacimiento mínimo" ayuda="Jugadores más grandes">
          <input
            type="number"
            className={claseCampo}
            value={anioMin}
            onChange={(e) => setAnioMin(Number(e.target.value))}
          />
        </Campo>
        <Campo etiqueta="Año de nacimiento máximo" ayuda="Jugadores más jóvenes">
          <input
            type="number"
            className={claseCampo}
            value={anioMax}
            onChange={(e) => setAnioMax(Number(e.target.value))}
          />
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Cupo de equipos">
          <input
            type="number"
            min={1}
            className={claseCampo}
            value={cupo}
            onChange={(e) => setCupo(Number(e.target.value))}
          />
        </Campo>
        <Campo etiqueta="Límite de plantel">
          <input
            type="number"
            min={1}
            className={claseCampo}
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
          />
        </Campo>
      </div>
      {valorInicial && (
        <p className="text-xs text-muted">
          Al cambiar el rango de años se recalcula la elegibilidad de los jugadores ya inscritos.
        </p>
      )}
      {error && <p className="text-sm font-medium text-danger-ink">{error}</p>}
      <div className="flex gap-2">
        <Boton type="submit">{valorInicial ? "Guardar cambios" : "Agregar categoría"}</Boton>
        {onCancelar && (
          <Boton intencion="neutral" variante="contorno" onClick={onCancelar}>
            Cancelar
          </Boton>
        )}
      </div>
    </form>
  );
}
