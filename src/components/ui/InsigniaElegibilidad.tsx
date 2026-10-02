import type { EstadoElegibilidad } from "@/lib/types";

const ESTILOS: Record<EstadoElegibilidad, string> = {
  Elegible: "bg-(--color-primary-light) text-(--color-primary-dark)",
  "No elegible por edad": "bg-(--color-danger-light) text-(--color-danger)",
  "Requiere revisión manual": "bg-(--color-warning-light) text-(--color-warning)",
};

export default function InsigniaElegibilidad({ estado }: { estado: EstadoElegibilidad }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILOS[estado]}`}
    >
      {estado}
    </span>
  );
}
