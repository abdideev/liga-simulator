"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, ScrollText } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import Tarjeta from "@/components/ui/Tarjeta";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import VistaDocumento, { SelloVersion } from "@/components/legal/DocumentoLegal";
import VistaConstancia from "@/components/legal/VistaConstancia";
import { AVISO_PRIVACIDAD, CASILLAS, CONDICIONES_LICENCIA, textoCanonico } from "@/lib/legal/documentos";
import { describirDispositivo, sha256Hex, useHuella } from "@/lib/legal/huella";
import { siguienteFolioConstancia } from "@/lib/legal/reglas";
import type { ConstanciaAceptacion } from "@/lib/types";

type Paso = "leer" | "codigo" | "listo";

const VIGENCIA_CODIGO_MS = 10 * 60 * 1000;

function generarCodigo(): string {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 1_000_000).padStart(6, "0");
}

const PASOS: { id: Paso; etiqueta: string }[] = [
  { id: "leer", etiqueta: "1. Leer y aceptar" },
  { id: "codigo", etiqueta: "2. Código de verificación" },
  { id: "listo", etiqueta: "3. Constancia" },
];

/**
 * Capa 2: the client's representative accepts the Condiciones de Uso y
 * Licencia on screen. Read to the end → two unchecked boxes → one-time code
 * sent to the email → Constancia de Aceptación with SHA-256 (Anexo D).
 */
export default function LicenciaPage() {
  const { estado, despachar } = useSimulador();
  const { administrador, licencia, constancias } = estado.legal;
  const [paso, setPaso] = useState<Paso>(licencia.estado === "pendiente" ? "leer" : "listo");
  const [leidoHastaFinal, setLeidoHastaFinal] = useState(false);
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false);
  const [declaraFacultades, setDeclaraFacultades] = useState(false);
  const [codigo, setCodigo] = useState<{ valor: string; enviadoEl: string } | null>(null);
  const [codigoEscrito, setCodigoEscrito] = useState("");
  const [error, setError] = useState<string | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const huellaTexto = useHuella(textoCanonico(CONDICIONES_LICENCIA));
  const vigente = constancias.find((c) => c.folio === licencia.folioConstanciaVigente);
  const casillaFacultades = CASILLAS.facultades(administrador.entidad);

  function alDesplazar() {
    const el = contenedor.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 16) setLeidoHastaFinal(true);
  }

  function enviarCodigo() {
    setCodigo({ valor: generarCodigo(), enviadoEl: new Date().toISOString() });
    setCodigoEscrito("");
    setError(null);
    setPaso("codigo");
  }

  async function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo) return;
    const ahora = new Date();
    if (ahora.getTime() - new Date(codigo.enviadoEl).getTime() > VIGENCIA_CODIGO_MS) {
      setError("El código caducó. Pide uno nuevo.");
      return;
    }
    if (codigoEscrito.trim() !== codigo.valor) {
      setError("El código no coincide. Revisa el correo e inténtalo de nuevo.");
      return;
    }
    const base: Omit<ConstanciaAceptacion, "huellaConstancia"> = {
      folio: siguienteFolioConstancia(estado, ahora.getFullYear()),
      documento: CONDICIONES_LICENCIA.titulo,
      version: CONDICIONES_LICENCIA.version,
      huellaTexto,
      cliente: administrador.entidad,
      representante: administrador.nombre,
      cargo: administrador.cargo,
      correo: administrador.correo,
      casillas: [CASILLAS.condiciones, casillaFacultades],
      codigoEnviadoEl: codigo.enviadoEl,
      codigoConfirmadoEl: ahora.toISOString(),
      recibidaEl: new Date(ahora.getTime() + 1000).toISOString(),
      ip: "No disponible en el prototipo (la registra el servidor)",
      dispositivo: describirDispositivo(),
      versionAviso: AVISO_PRIVACIDAD.version,
    };
    const huellaConstancia = await sha256Hex(JSON.stringify(base));
    const resultado = despachar({ tipo: "registrarConstancia", constancia: { ...base, huellaConstancia } });
    if (!resultado.ok) {
      setError(resultado.motivo ?? "No se pudo registrar la aceptación");
      return;
    }
    setPaso("listo");
  }

  const ultima = constancias[constancias.length - 1];

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="pagina-licencia">
      <EncabezadoPagina
        icono={ICONO_SECCION.licencia}
        titulo="Condiciones de Uso y Licencia"
        descripcion={`Aceptación electrónica del cliente · ${administrador.entidad}`}
      />

      <ol className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
        {PASOS.map((p) => {
          const activo = p.id === paso;
          return (
            <li
              key={p.id}
              className={`rounded-full px-2 py-2 ${activo ? "bg-ink text-paper" : "bg-control text-muted"}`}
            >
              {p.etiqueta}
            </li>
          );
        })}
      </ol>

      {paso === "leer" && (
        <Tarjeta className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              Acepta: <span className="font-medium text-ink">{administrador.nombre}</span>, {administrador.cargo}
            </p>
            <SelloVersion doc={CONDICIONES_LICENCIA} />
          </div>
          <div
            ref={contenedor}
            onScroll={alDesplazar}
            className="max-h-[420px] overflow-y-auto rounded-2xl bg-canvas p-4"
            data-testid="texto-condiciones"
          >
            <VistaDocumento doc={CONDICIONES_LICENCIA} mostrarEncabezado={false} />
          </div>
          {!leidoHastaFinal && (
            <p className="flex items-center gap-2 text-xs font-medium text-warn-ink">
              <ScrollText size={14} /> Desplázate hasta el final del texto para habilitar las casillas.
            </p>
          )}
          <div className={`space-y-3 ${leidoHastaFinal ? "" : "opacity-50"}`}>
            <label className="flex items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                disabled={!leidoHastaFinal}
                checked={aceptaCondiciones}
                onChange={(e) => setAceptaCondiciones(e.target.checked)}
                data-testid="casilla-condiciones"
                className="mt-0.5"
              />
              <span>{CASILLAS.condiciones}</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                disabled={!leidoHastaFinal}
                checked={declaraFacultades}
                onChange={(e) => setDeclaraFacultades(e.target.checked)}
                data-testid="casilla-facultades"
                className="mt-0.5"
              />
              <span>{casillaFacultades}</span>
            </label>
          </div>
          <Boton
            onClick={enviarCodigo}
            disabled={!aceptaCondiciones || !declaraFacultades || !huellaTexto}
            data-testid="boton-aceptar-condiciones"
          >
            Aceptar y continuar
            <ArrowRight size={16} />
          </Boton>
        </Tarjeta>
      )}

      {paso === "codigo" && codigo && (
        <div className="space-y-4">
          <Tarjeta className="space-y-2 border-l-4 border-accent" data-testid="correo-simulado">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Mail size={14} /> Correo simulado · el prototipo no envía correos reales
            </p>
            <p className="text-sm text-ink">
              <span className="text-muted">Para:</span> {administrador.correo}
            </p>
            <p className="text-sm text-ink">
              Tu código para aceptar las Condiciones de Uso y Licencia v{CONDICIONES_LICENCIA.version} es{" "}
              <span className="rounded-lg bg-canvas px-2 py-0.5 font-mono text-base font-semibold tracking-widest">
                {codigo.valor}
              </span>
              . Vence en 10 minutos y solo sirve una vez.
            </p>
          </Tarjeta>
          <Tarjeta>
            <form onSubmit={confirmarCodigo} className="space-y-4">
              <Campo etiqueta="Código de verificación" ayuda="Escribe los 6 dígitos que llegaron a tu correo">
                <input
                  className={`${claseCampo} font-mono tracking-[0.4em]`}
                  inputMode="numeric"
                  maxLength={6}
                  value={codigoEscrito}
                  onChange={(e) => setCodigoEscrito(e.target.value.replace(/\D/g, ""))}
                  data-testid="campo-codigo"
                />
              </Campo>
              {error && <Aviso intencion="danger">{error}</Aviso>}
              <div className="flex flex-wrap gap-2">
                <Boton type="submit" disabled={codigoEscrito.length !== 6} data-testid="boton-confirmar-codigo">
                  Confirmar y firmar
                </Boton>
                <Boton type="button" variante="texto" intencion="neutral" onClick={enviarCodigo}>
                  Enviar otro código
                </Boton>
              </div>
            </form>
          </Tarjeta>
        </div>
      )}

      {paso === "listo" && (vigente ?? ultima) && (
        <Tarjeta className="space-y-4">
          <Aviso intencion="ok" icono={CheckCircle2}>
            Condiciones aceptadas. El contrato quedó perfeccionado al recibir A&amp;I la aceptación y la licencia
            de la temporada está activa.
          </Aviso>
          <h2 className="text-base font-semibold text-ink">Constancia de aceptación electrónica</h2>
          <VistaConstancia constancia={(vigente ?? ultima)!} />
          <Link href="/cuenta">
            <Boton variante="suave">
              Ver mi plan
              <ArrowRight size={16} />
            </Boton>
          </Link>
        </Tarjeta>
      )}
    </div>
  );
}
