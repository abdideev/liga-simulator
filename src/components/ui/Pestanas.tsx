"use client";

import { useId } from "react";
import { motion } from "motion/react";

import { RESORTE_SUAVE } from "./movimiento";

/** Segmented control: gray pill track with a white pill that slides to the active tab. */
export default function Pestanas<T extends string>({
  opciones,
  valor,
  onCambiar,
}: {
  opciones: { id: T; etiqueta: string }[];
  valor: T;
  onCambiar: (id: T) => void;
}) {
  const grupo = useId();
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-full bg-control p-1">
      {opciones.map((opcion) => {
        const activa = valor === opcion.id;
        return (
          <motion.button
            key={opcion.id}
            type="button"
            role="tab"
            aria-selected={activa}
            data-testid={`pestana-${opcion.id}`}
            onClick={() => onCambiar(opcion.id)}
            whileTap={{ scale: 0.96 }}
            className={`relative min-h-10 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors duration-150 ${
              activa ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {activa && (
              <motion.span
                layoutId={`pestana-activa-${grupo}`}
                transition={RESORTE_SUAVE}
                className="absolute inset-0 rounded-full bg-paper shadow-control"
              />
            )}
            <span className="relative">{opcion.etiqueta}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
