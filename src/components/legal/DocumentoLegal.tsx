"use client";

import { Fingerprint } from "lucide-react";

import { huellaCorta, useHuella } from "@/lib/legal/huella";
import { textoCanonico, type DocumentoLegal } from "@/lib/legal/documentos";

/** Version + SHA-256 of the exact text on screen: what an acceptance record points to. */
export function SelloVersion({ doc, completo = false }: { doc: DocumentoLegal; completo?: boolean }) {
  const huella = useHuella(textoCanonico(doc));
  return (
    <p
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted"
      data-testid={`sello-${doc.id}`}
    >
      <Fingerprint size={14} className="text-accent" />
      <span className="font-medium text-ink">Versión {doc.version}</span>
      <span>·</span>
      <span>
        Huella SHA-256:{" "}
        <code className="break-all rounded bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink">
          {completo ? huella || "calculando…" : huellaCorta(huella)}
        </code>
      </span>
    </p>
  );
}

/** Full text of a legal document, with its sections, lists and tables. */
export default function VistaDocumento({
  doc,
  mostrarEncabezado = true,
}: {
  doc: DocumentoLegal;
  mostrarEncabezado?: boolean;
}) {
  return (
    <article className="space-y-5 text-sm leading-relaxed text-ink" data-testid={`documento-${doc.id}`}>
      {mostrarEncabezado && (
        <header className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{doc.titulo}</h2>
          <p className="text-muted">{doc.descripcion}</p>
          <SelloVersion doc={doc} completo />
        </header>
      )}
      {doc.secciones.map((s) => (
        <section key={s.titulo} className="space-y-2">
          <h3 className="font-semibold">{s.titulo}</h3>
          {s.tabla && (
            <div className="overflow-x-auto rounded-2xl ring-1 ring-ink/5">
              <table className="w-full min-w-[420px] text-left text-[13px]">
                <thead>
                  <tr className="bg-canvas text-xs uppercase tracking-wide text-muted">
                    {s.tabla.encabezados.map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.tabla.filas.map((f) => (
                    <tr key={f[0]} className="border-t border-canvas align-top">
                      {f.map((c, i) => (
                        <td key={i} className={`px-3 py-2 ${i === 0 ? "font-medium" : "text-muted"}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {s.parrafos?.map((p) => (
            <p key={p.slice(0, 40)} className="text-muted">
              {p}
            </p>
          ))}
          {s.lista && (
            <ul className="list-disc space-y-1 pl-5 text-muted">
              {s.lista.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
