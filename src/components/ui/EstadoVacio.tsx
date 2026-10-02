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
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-(--color-border) bg-white/60 px-6 py-12 text-center">
      <Icono size={36} className="text-gray-400" />
      <div className="space-y-1">
        <p className="font-semibold text-gray-800">{titulo}</p>
        <p className="mx-auto max-w-sm text-sm text-gray-500">{descripcion}</p>
      </div>
      {accion}
    </div>
  );
}
