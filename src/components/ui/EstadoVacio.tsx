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
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-paper px-6 py-14 text-center shadow-suave">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-canvas text-muted">
        <Icono size={24} />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-ink">{titulo}</p>
        <p className="mx-auto max-w-sm text-sm text-muted">{descripcion}</p>
      </div>
      {accion}
    </div>
  );
}
