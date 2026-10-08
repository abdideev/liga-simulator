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
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
          <Icono size={20} />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{titulo}</h1>
          {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
        </div>
      </div>
      {accion}
    </div>
  );
}
