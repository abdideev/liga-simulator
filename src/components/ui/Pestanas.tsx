"use client";

/** Segmented control: gray pill track with a raised white pill for the active tab. */
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
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-full bg-control p-1">
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
            className={`min-h-10 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ${
              activa ? "bg-paper text-ink shadow-control" : "text-muted hover:text-ink"
            }`}
          >
            {opcion.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
