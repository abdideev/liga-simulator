"use client";

import Link from "next/link";

import { AVISO_PRIVACIDAD, textoCanonico } from "@/lib/legal/documentos";
import { huellaCorta, useHuella } from "@/lib/legal/huella";

/** Footer on every screen: links to the legal texts, copyright and the notice's version. */
export default function PieLegal() {
  const huella = useHuella(textoCanonico(AVISO_PRIVACIDAD));
  const enlace = "min-h-0 underline-offset-2 hover:text-ink hover:underline";
  return (
    <footer
      className="mt-12 flex flex-col gap-2 border-t border-ink/5 pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"
      data-testid="pie-legal"
    >
      <nav aria-label="Documentos legales" className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/privacidad" className={enlace}>
          Aviso de privacidad
        </Link>
        <Link href="/legal?doc=terminos" className={enlace}>
          Términos de uso
        </Link>
        <Link href="/legal?doc=condiciones" className={enlace}>
          Condiciones de licencia
        </Link>
        <Link href="/legal?doc=creditos" className={enlace}>
          Créditos y licencias
        </Link>
      </nav>
      <p>
        © 2026 A&amp;I Software · Aviso v{AVISO_PRIVACIDAD.version} · huella{" "}
        <code className="font-mono">{huellaCorta(huella)}</code>
      </p>
    </footer>
  );
}
