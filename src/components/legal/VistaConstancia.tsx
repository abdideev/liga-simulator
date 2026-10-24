"use client";

import { Printer } from "lucide-react";

import Boton from "@/components/ui/Boton";
import type { ConstanciaAceptacion } from "@/lib/types";

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "America/Mexico_City",
  });
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", { timeZone: "America/Mexico_City" });
}

/** Rows of the Constancia de Aceptación (Anexo D): field, value, and what it proves. */
export function filasConstancia(c: ConstanciaAceptacion): [string, string, string][] {
  return [
    ["Folio", c.folio, "Identifica la aceptación."],
    ["Documento aceptado", `${c.documento}, versión ${c.version}`, "Qué texto se aceptó."],
    ["Huella del texto (SHA-256)", c.huellaTexto, "El texto no se alteró (CCom art. 93)."],
    ["Cliente", c.cliente, "Quién queda obligado."],
    ["Representante", `${c.representante}, ${c.cargo}`, "Quién acepta y con qué carácter."],
    ["Correo verificado", c.correo, "Domicilio electrónico para notificaciones."],
    ["Casillas marcadas", c.casillas.map((t, i) => `${i + 1}. ${t}`).join("  "), "Consentimiento y facultades."],
    [
      "Código de un solo uso",
      `Enviado a las ${hora(c.codigoEnviadoEl)} y confirmado a las ${hora(c.codigoConfirmadoEl)}`,
      "Atribuye la aceptación a esa persona (art. 90).",
    ],
    ["Recepción por A&I", `${fechaHora(c.recibidaEl)} (hora del centro de México)`, "Perfecciona el contrato (art. 80)."],
    ["IP y dispositivo", `${c.ip} · ${c.dispositivo}`, "Refuerza la atribución."],
    ["Aviso de privacidad mostrado", `Versión ${c.versionAviso}`, "Qué aviso tuvo a la vista."],
    ["Huella de esta constancia", c.huellaConstancia, "Impide alterarla sin que se note (art. 1298-A)."],
  ];
}

function imprimir(c: ConstanciaAceptacion) {
  const ventana = window.open("", "_blank", "width=820,height=900");
  if (!ventana) return;
  const filas = filasConstancia(c)
    .map(
      ([campo, valor, sirve]) =>
        `<tr><th>${campo}</th><td>${valor.replace(/</g, "&lt;")}</td><td class="s">${sirve}</td></tr>`
    )
    .join("");
  ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Constancia ${c.folio}</title>
<style>body{font-family:system-ui,sans-serif;margin:32px;color:#11181c}h1{font-size:18px;margin:0}p{color:#687076;font-size:12px}
table{border-collapse:collapse;width:100%;font-size:12px;margin-top:16px}th,td{border:1px solid #e4e4e0;padding:6px 8px;text-align:left;vertical-align:top}
th{width:22%;background:#f4f4f5}td{word-break:break-all}.s{color:#687076;width:26%;word-break:normal}</style></head><body>
<h1>Constancia de aceptación electrónica</h1><p>A&amp;I Software, S. de R.L. de C.V. · Se conserva diez años (Código de Comercio, art. 49) · Copia enviada a ambas partes</p>
<table>${filas}</table><script>window.print()</script></body></html>`);
  ventana.document.close();
}

export default function VistaConstancia({ constancia }: { constancia: ConstanciaAceptacion }) {
  return (
    <div className="space-y-4" data-testid="constancia">
      <div className="overflow-x-auto rounded-2xl ring-1 ring-ink/5">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <tbody>
            {filasConstancia(constancia).map(([campo, valor, sirve]) => (
              <tr key={campo} className="border-t border-canvas align-top first:border-0">
                <th className="w-44 bg-canvas px-3 py-2 font-medium text-ink">{campo}</th>
                <td className="break-words px-3 py-2 text-ink">
                  {campo.startsWith("Huella") ? <code className="break-all font-mono text-[11px]">{valor}</code> : valor}
                </td>
                <td className="w-52 px-3 py-2 text-xs text-muted">{sirve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Se envió copia a {constancia.correo} y a A&amp;I. Se archiva diez años en un registro de solo lectura.
        </p>
        <Boton variante="suave" onClick={() => imprimir(constancia)}>
          <Printer size={16} />
          Imprimir o guardar PDF
        </Boton>
      </div>
    </div>
  );
}
