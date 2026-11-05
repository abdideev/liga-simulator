"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, History } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import Boton from "@/components/ui/Boton";
import Pestanas from "@/components/ui/Pestanas";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import VistaDocumento, { SelloVersion } from "@/components/legal/DocumentoLegal";
import { AVISO_PRIVACIDAD, AVISO_SIMPLIFICADO, textoCanonico } from "@/lib/legal/documentos";
import { useHuella } from "@/lib/legal/huella";
import { usuarioActual } from "@/lib/legal/reglas";

type Pestana = "integral" | "simplificado" | "versiones";

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "integral", etiqueta: "Aviso integral" },
  { id: "simplificado", etiqueta: "Aviso simplificado" },
  { id: "versiones", etiqueta: "Versiones" },
];

/**
 * Privacy notice, always reachable (also for the public view and before
 * signing up), with its version and the SHA-256 of the exact text.
 */
export default function PrivacidadPage() {
  const { estado } = useSimulador();
  const [pestana, setPestana] = useState<Pestana>("integral");
  const usuario = usuarioActual(estado);
  const huella = useHuella(textoCanonico(AVISO_PRIVACIDAD));
  const miAceptacion = usuario
    ? [...estado.legal.aceptaciones].reverse().find((a) => a.usuario === usuario.clave)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="pagina-privacidad">
      <EncabezadoPagina
        icono={ICONO_SECCION.privacidad}
        titulo="Aviso de privacidad"
        descripcion="Qué datos tratamos, para qué, dónde se guardan y cómo ejercer sus derechos"
        accion={
          usuario ? (
            <Link href="/cuenta?tab=arco">
              <Boton variante="suave">
                Ejercer mis derechos ARCO
                <ArrowRight size={16} />
              </Boton>
            </Link>
          ) : undefined
        }
      />

      <Tarjeta className="flex flex-wrap items-center justify-between gap-3 py-4">
        <SelloVersion doc={AVISO_PRIVACIDAD} />
        {miAceptacion ? (
          <Etiqueta intencion="ok">
            Lo leíste el {new Date(miAceptacion.fecha).toLocaleDateString("es-MX")} (v{miAceptacion.versionAviso})
          </Etiqueta>
        ) : (
          <Etiqueta intencion="neutral">Responsable: Municipio · Encargada: A&amp;I Software</Etiqueta>
        )}
      </Tarjeta>

      <Pestanas opciones={PESTANAS} valor={pestana} onCambiar={setPestana} />

      <Tarjeta>
        {pestana === "integral" && <VistaDocumento doc={AVISO_PRIVACIDAD} />}
        {pestana === "simplificado" && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Es el texto corto que aparece en pantalla antes de capturar cualquier dato: al crear una
              cuenta y al inscribir a un jugador.
            </p>
            <VistaDocumento doc={AVISO_SIMPLIFICADO} />
          </div>
        )}
        {pestana === "versiones" && (
          <div className="space-y-3" data-testid="versiones-aviso">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <History size={16} /> Historial de versiones
            </p>
            <div className="overflow-x-auto rounded-2xl ring-1 ring-ink/5">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="bg-canvas text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2">Versión</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Huella SHA-256</th>
                    <th className="px-3 py-2">Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-canvas align-top">
                    <td className="px-3 py-2 font-medium">{AVISO_PRIVACIDAD.version}</td>
                    <td className="px-3 py-2">
                      <Etiqueta intencion="ok">Vigente</Etiqueta>
                    </td>
                    <td className="break-all px-3 py-2 font-mono text-[11px] text-muted">{huella || "calculando…"}</td>
                    <td className="px-3 py-2 text-muted">Versión inicial.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">
              Cada versión se conserva. Si un cambio agrega una finalidad, la plataforma vuelve a pedir el
              consentimiento y avisa por correo.
            </p>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
