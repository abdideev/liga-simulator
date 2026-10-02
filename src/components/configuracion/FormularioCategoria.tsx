"use client";

import { useState } from "react";

import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import type { Categoria } from "@/lib/types";

export interface DatosCategoria {
  nombre: string;
  anioNacimientoMin: number;
  anioNacimientoMax: number;
  cupoEquipos: number;
  limiteJugadoresPorPlantel: number;
}

export default function FormularioCategoria({
  valorInicial,
  onGuardar,
  onCancelar,
}: {
  valorInicial?: Categoria;
  onGuardar: (datos: DatosCategoria) => void;
  onCancelar?: () => void;
}) {
  const anioActual = new Date().getFullYear();
  const [nombre, setNombre] = useState(valorInicial?.nombre ?? "");
  const [anioMin, setAnioMin] = useState(
    valorInicial?.anioNacimientoMin ?? anioActual - 45
  );
  const [anioMax, setAnioMax] = useState(
    valorInicial?.anioNacimientoMax ?? anioActual - 18
  );
  const [cupo, setCupo] = useState(valorInicial?.cupoEquipos ?? 8);
  const [limite, setLimite] = useState(valorInicial?.limiteJugadoresPorPlantel ?? 20);
  const [error, setError] = useState<string | null>(null);

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre de la categoría es obligatorio");
      return;
    }
    if (anioMin > anioMax) {
      setError("El año mínimo no puede ser mayor que el año máximo");
      return;
    }
    if (cupo < 1 || limite < 1) {
      setError("El cupo de equipos y el límite de plantel deben ser mayores a 0");
      return;
    }
    setError(null);
    onGuardar({
      nombre: nombre.trim(),
      anioNacimientoMin: anioMin,
      anioNacimientoMax: anioMax,
      cupoEquipos: cupo,
      limiteJugadoresPorPlantel: limite,
    });
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-3">
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
      {error && <p className="text-sm font-medium text-(--color-danger)">{error}</p>}
      <div className="flex gap-2">
        <Boton type="submit">{valorInicial ? "Guardar cambios" : "Agregar categoría"}</Boton>
        {onCancelar && (
          <Boton type="button" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Boton>
        )}
      </div>
    </form>
  );
}
