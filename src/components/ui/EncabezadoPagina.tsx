import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EncabezadoPagina({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: LucideIcon;
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper text-accent shadow-suave">
          <Icono size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{titulo}</h1>
          {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
        </div>
      </div>
      {accion}
    </div>
  );
}
