import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EstadoVacio({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-paper text-muted shadow-sm">
        <Icono size={22} />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-ink">{titulo}</p>
        <p className="mx-auto max-w-sm text-sm text-muted">{descripcion}</p>
      </div>
      {accion}
    </div>
  );
}
