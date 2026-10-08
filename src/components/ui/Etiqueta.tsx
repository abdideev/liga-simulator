import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";

import { CLASES_INTENCION, type EstiloVariante, type Intencion } from "./estilos";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  intencion?: Intencion;
  variante?: Exclude<EstiloVariante, "texto">;
  icono?: LucideIcon;
}

/** Small status label (chip) in one of the five intents. */
export default function Etiqueta({
  intencion = "neutral",
  variante = "suave",
  icono: Icono,
  className = "",
  children,
  ...props
}: Props) {
  // Labels are not interactive: strip the hover classes of the shared map.
  const clases = CLASES_INTENCION[intencion][variante]
    .split(" ")
    .filter((c) => !c.startsWith("hover:"))
    .join(" ");
  return (
    <span
      {...props}
      className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${clases} ${className}`}
    >
      {Icono && <Icono size={13} strokeWidth={2.25} />}
      {children}
    </span>
  );
}
