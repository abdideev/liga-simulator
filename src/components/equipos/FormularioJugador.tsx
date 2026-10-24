"use client";

import { useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";

import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import { esMenorDeEdad, NUMERO_PLAYERA_MAX, NUMERO_PLAYERA_MIN } from "@/lib/rules";
import { AVISO_SIMPLIFICADO, CONSENTIMIENTO_TUTOR } from "@/lib/legal/documentos";
import type { Parentesco, ResultadoOperacion, TutorInfo } from "@/lib/types";

export interface DatosNuevoJugadorFormulario {
  nombreCompleto: string;
  fechaNacimiento: string;
  curp: string;
  numero?: number;
  tutor?: TutorInfo;
}

export default function FormularioJugador({
  onGuardar,
  plantelLleno,
}: {
  onGuardar: (datos: DatosNuevoJugadorFormulario) => ResultadoOperacion;
  /** Set when the roster already reached the category's limit. */
  plantelLleno?: string;
}) {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [curp, setCurp] = useState("");
  const [numero, setNumero] = useState("");
  const [tutorNombre, setTutorNombre] = useState("");
  const [consentimiento, setConsentimiento] = useState(false);
  const [parentesco, setParentesco] = useState<Parentesco>("madre");
  const [declaracion, setDeclaracion] = useState(false);
  const [publicarNombre, setPublicarNombre] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const esMenor = fechaNacimiento ? esMenorDeEdad(fechaNacimiento) : false;

  function limpiar() {
    setNombreCompleto("");
    setFechaNacimiento("");
    setCurp("");
    setNumero("");
    setTutorNombre("");
    setConsentimiento(false);
    setDeclaracion(false);
    setPublicarNombre(false);
  }

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setExito(null);
    // All business validation (required fields, roster limit, shirt number,
    // guardian consent) lives in validarAccion; the form only reports it.
    const resultado = onGuardar({
      nombreCompleto,
      fechaNacimiento,
      curp,
      numero: numero === "" ? undefined : Number(numero),
      tutor: esMenor
        ? {
            nombre: tutorNombre.trim(),
            parentesco,
            declaracion,
            consentimiento,
            publicarNombre,
            versionAviso: CONSENTIMIENTO_TUTOR.version,
          }
        : undefined,
    });

    if (!resultado.ok) {
      setError(resultado.motivo ?? "No se pudo guardar el jugador");
      return;
    }
    setError(null);
    setExito(`${nombreCompleto.trim()} fue inscrito correctamente`);
    limpiar();
  }

  if (plantelLleno) {
    return <Aviso intencion="warn">{plantelLleno}</Aviso>;
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-4" data-testid="formulario-jugador">
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
          {nombreCompleto.trim() ? (
            nombreCompleto
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("")
          ) : (
            <UserRound size={22} />
          )}
        </div>
        <p className="text-xs text-muted">
          Marcador de fotografía. La carga de imágenes no aplica en este prototipo.
        </p>
      </div>

      <Campo etiqueta="Nombre completo">
        <input
          className={claseCampo}
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          placeholder="Nombre y apellidos"
          data-testid="campo-nombre-jugador"
        />
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Fecha de nacimiento">
          <input
            type="date"
            className={claseCampo}
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            data-testid="campo-fecha-nacimiento"
          />
        </Campo>
        <Campo etiqueta="Número (opcional)" ayuda={`Entre ${NUMERO_PLAYERA_MIN} y ${NUMERO_PLAYERA_MAX}, sin repetir`}>
          <input
            type="number"
            min={NUMERO_PLAYERA_MIN}
            max={NUMERO_PLAYERA_MAX}
            className={claseCampo}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            data-testid="campo-numero"
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
          data-testid="campo-curp"
        />
      </Campo>

      {esMenor && (
        <div className="space-y-4 rounded-2xl bg-warn-soft p-4" data-testid="bloque-tutor">
          <p className="text-sm font-semibold text-warn-ink">
            Jugador menor de edad — decide su padre, madre o tutor
          </p>

          <div className="space-y-1 rounded-xl bg-paper/70 p-3 text-xs leading-relaxed text-ink">
            <p className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={14} className="text-accent" /> Aviso de privacidad
            </p>
            <p className="text-muted">{AVISO_SIMPLIFICADO.secciones[0].parrafos![0]}</p>
            <a href="/privacidad" target="_blank" className="font-medium text-accent-ink underline">
              Leer aviso integral
            </a>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Campo etiqueta="Nombre del tutor">
              <input
                className={claseCampo}
                value={tutorNombre}
                onChange={(e) => setTutorNombre(e.target.value)}
                data-testid="campo-nombre-tutor"
              />
            </Campo>
            <Campo etiqueta="Parentesco">
              <select
                className={claseCampo}
                value={parentesco}
                onChange={(e) => setParentesco(e.target.value as Parentesco)}
              >
                <option value="madre">Madre</option>
                <option value="padre">Padre</option>
                <option value="tutor">Tutor</option>
              </select>
            </Campo>
          </div>

          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={declaracion}
              onChange={(e) => setDeclaracion(e.target.checked)}
              data-testid="casilla-declaracion"
              className="mt-0.5"
            />
            <span>
              Declaro bajo protesta de decir verdad que soy {parentesco} de{" "}
              {nombreCompleto.trim() || "[nombre del menor]"} y que ejerzo la patria potestad o la tutela.{" "}
              <span className="text-danger-ink">*</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
              data-testid="casilla-consentimiento"
              className="mt-0.5"
            />
            <span>
              <strong>Consentimiento 1 (obligatorio).</strong> Consiento el tratamiento de los datos del menor y
              los míos para inscribirlo, verificar su elegibilidad y registrar sus partidos y estadísticas.{" "}
              <span className="text-danger-ink">*</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={publicarNombre}
              onChange={(e) => setPublicarNombre(e.target.checked)}
              data-testid="casilla-publicar-nombre"
              className="mt-0.5"
            />
            <span>
              <strong>Consentimiento 2 (opcional).</strong> Consiento que su nombre y dorsal se muestren en la
              consulta pública. Si no la marco, solo se mostrará su dorsal.
            </span>
          </label>
          <p className="text-xs text-warn-ink">
            Las casillas llegan vacías. Nunca se publican la fecha de nacimiento, la CURP ni el contacto del
            menor. Textos v{CONSENTIMIENTO_TUTOR.version}.
          </p>
        </div>
      )}

      {error && (
        <Aviso intencion="danger" data-testid="error-inscripcion">
          {error}
        </Aviso>
      )}
      {exito && <Aviso intencion="ok">{exito}</Aviso>}

      <Boton type="submit" data-testid="boton-inscribir-jugador">
        Inscribir jugador
      </Boton>
    </form>
  );
}
