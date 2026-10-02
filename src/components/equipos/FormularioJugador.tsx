"use client";

import { useMemo, useState } from "react";

import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import { esMenorDeEdad } from "@/lib/rules";

export interface DatosNuevoJugadorFormulario {
  nombreCompleto: string;
  fechaNacimiento: string;
  curp: string;
  numero?: number;
  tutor?: { nombre: string; consentimiento: boolean };
}

export default function FormularioJugador({
  onGuardar,
}: {
  onGuardar: (datos: DatosNuevoJugadorFormulario) => { ok: boolean; motivo?: string };
}) {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [curp, setCurp] = useState("");
  const [numero, setNumero] = useState("");
  const [tutorNombre, setTutorNombre] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const esMenor = useMemo(
    () => (fechaNacimiento ? esMenorDeEdad(fechaNacimiento) : false),
    [fechaNacimiento]
  );

  function limpiar() {
    setNombreCompleto("");
    setFechaNacimiento("");
    setCurp("");
    setNumero("");
    setTutorNombre("");
    setConsentimiento(false);
  }

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setExito(null);
    if (!nombreCompleto.trim() || !fechaNacimiento || !curp.trim()) {
      setError("Nombre, fecha de nacimiento y CURP son obligatorios");
      return;
    }
    if (esMenor && (!consentimiento || !tutorNombre.trim())) {
      setError(
        "Para jugadores menores de edad se requiere el nombre del tutor y su consentimiento"
      );
      return;
    }

    const resultado = onGuardar({
      nombreCompleto: nombreCompleto.trim(),
      fechaNacimiento,
      curp: curp.trim().toUpperCase(),
      numero: numero ? Number(numero) : undefined,
      tutor: esMenor ? { nombre: tutorNombre.trim(), consentimiento } : undefined,
    });

    if (!resultado.ok) {
      setError(resultado.motivo ?? "No se pudo guardar el jugador");
      return;
    }
    setError(null);
    setExito(`${nombreCompleto.trim()} fue inscrito correctamente`);
    limpiar();
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-(--color-primary-light) text-sm font-bold text-(--color-primary-dark)">
          {nombreCompleto
            ? nombreCompleto
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("")
            : "FOTO"}
        </div>
        <p className="text-xs text-gray-500">
          Marcador de fotografía. La carga de imágenes no aplica en este prototipo.
        </p>
      </div>

      <Campo etiqueta="Nombre completo">
        <input
          className={claseCampo}
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          placeholder="Nombre y apellidos"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Fecha de nacimiento">
          <input
            type="date"
            className={claseCampo}
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Número (opcional)">
          <input
            type="number"
            min={1}
            max={99}
            className={claseCampo}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </Campo>
      </div>

      <Campo etiqueta="CURP" ayuda="Se valida solo la estructura, no contra el RENAPO">
        <input
          className={`${claseCampo} uppercase`}
          value={curp}
          maxLength={18}
          onChange={(e) => setCurp(e.target.value.toUpperCase())}
          placeholder="18 caracteres"
        />
      </Campo>

      {esMenor && (
        <div className="space-y-2 rounded-lg border border-(--color-warning) bg-(--color-warning-light) p-3">
          <p className="text-sm font-semibold text-(--color-warning)">
            Jugador menor de edad — se requiere consentimiento del tutor
          </p>
          <Campo etiqueta="Nombre del tutor">
            <input
              className={claseCampo}
              value={tutorNombre}
              onChange={(e) => setTutorNombre(e.target.value)}
            />
          </Campo>
          <label className="flex min-h-11 items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
            />
            El tutor otorga su consentimiento para la participación del menor
          </label>
        </div>
      )}

      {error && <p className="text-sm font-medium text-(--color-danger)">{error}</p>}
      {exito && (
        <p className="text-sm font-medium text-(--color-primary-dark)">{exito}</p>
      )}

      <Boton type="submit">Inscribir jugador</Boton>
    </form>
  );
}
