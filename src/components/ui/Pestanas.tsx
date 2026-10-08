"use client";

export default function Pestanas<T extends string>({
  opciones,
  valor,
  onCambiar,
}: {
  opciones: { id: T; etiqueta: string }[];
  valor: T;
  onCambiar: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1">
      {opciones.map((opcion) => {
        const activa = valor === opcion.id;
        return (
          <button
            key={opcion.id}
            type="button"
            role="tab"
            aria-selected={activa}
            data-testid={`pestana-${opcion.id}`}
            onClick={() => onCambiar(opcion.id)}
            className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors ${
              activa ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
