"use client";

import { useState } from "react";

import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import Pestanas from "@/components/ui/Pestanas";
import Tarjeta from "@/components/ui/Tarjeta";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import VistaDocumento from "@/components/legal/DocumentoLegal";
import { CONDICIONES_LICENCIA, CONSENTIMIENTO_TUTOR, TERMINOS_USO } from "@/lib/legal/documentos";

type Pestana = "terminos" | "condiciones" | "consentimiento" | "creditos";

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "terminos", etiqueta: "Términos de uso" },
  { id: "condiciones", etiqueta: "Condiciones de licencia" },
  { id: "consentimiento", etiqueta: "Consentimiento del tutor" },
  { id: "creditos", etiqueta: "Créditos" },
];

const BIBLIOTECAS = [
  { nombre: "Next.js", version: "16.3.1", licencia: "MIT", uso: "Marco de la aplicación web" },
  { nombre: "React y React DOM", version: "19.2.8", licencia: "MIT", uso: "Interfaz" },
  { nombre: "Tailwind CSS", version: "4.3.3", licencia: "MIT", uso: "Estilos" },
  { nombre: "Motion", version: "14.0.0", licencia: "MIT", uso: "Animaciones" },
  { nombre: "Lucide", version: "1.33.0", licencia: "ISC", uso: "Íconos" },
  { nombre: "Inter (tipografía)", version: "Google Fonts", licencia: "SIL OFL 1.1", uso: "Tipografía" },
];

const EQUIPO = [
  ["Ivan Rojo", "Dirección General"],
  ["Abdiel Avila", "Producto"],
  ["Angel Yael Flores", "Ingeniería"],
  ["Yareth López", "Tecnología"],
];

function pestanaInicial(): Pestana {
  if (typeof window === "undefined") return "terminos";
  const doc = new URLSearchParams(window.location.search).get("doc");
  return PESTANAS.some((p) => p.id === doc) ? (doc as Pestana) : "terminos";
}

/** Contract texts of the three layers plus the copyright and open-source credits. */
export default function LegalPage() {
  const [pestana, setPestana] = useState<Pestana>(pestanaInicial);

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="pagina-legal">
      <EncabezadoPagina
        icono={ICONO_SECCION.licencia}
        titulo="Documentos legales"
        descripcion="Términos, Condiciones de licencia, consentimiento del tutor y créditos"
      />
      <Pestanas opciones={PESTANAS} valor={pestana} onCambiar={setPestana} />
      <Tarjeta>
        {pestana === "terminos" && <VistaDocumento doc={TERMINOS_USO} />}
        {pestana === "condiciones" && <VistaDocumento doc={CONDICIONES_LICENCIA} />}
        {pestana === "consentimiento" && <VistaDocumento doc={CONSENTIMIENTO_TUTOR} />}
        {pestana === "creditos" && (
          <div className="space-y-5 text-sm" data-testid="creditos">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-ink">Sistema de Gestión de la Liga Municipal · prototipo</h2>
              <p className="text-muted">
                © 2026 A&amp;I Software, S. de R.L. de C.V. Todos los derechos reservados. El software se
                protege como obra (Ley Federal del Derecho de Autor, arts. 101 a 106). Registro ante INDAUTOR:
                pendiente. Marca: pendiente de solicitud ante el IMPI.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-ink">Autoría (obra en colaboración)</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {EQUIPO.map(([n, r]) => (
                  <li key={n} className="rounded-2xl bg-canvas px-3 py-2">
                    <span className="font-medium text-ink">{n}</span>
                    <span className="block text-xs text-muted">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-ink">Software de terceros</h3>
              <div className="overflow-x-auto rounded-2xl ring-1 ring-ink/5">
                <table className="w-full min-w-[420px] text-left">
                  <thead>
                    <tr className="bg-canvas text-xs uppercase tracking-wide text-muted">
                      <th className="px-3 py-2">Componente</th>
                      <th className="px-3 py-2">Versión</th>
                      <th className="px-3 py-2">Licencia</th>
                      <th className="px-3 py-2">Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BIBLIOTECAS.map((b) => (
                      <tr key={b.nombre} className="border-t border-canvas">
                        <td className="px-3 py-2 font-medium text-ink">{b.nombre}</td>
                        <td className="px-3 py-2 text-muted">{b.version}</td>
                        <td className="px-3 py-2 text-muted">{b.licencia}</td>
                        <td className="px-3 py-2 text-muted">{b.uso}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted">
                Las licencias MIT, ISC y OFL permiten el uso comercial siempre que se conserve el aviso de
                derechos de autor del componente. Versiones tomadas de package-lock.json.
              </p>
            </div>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
