"use client";

import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro" | "fantasma";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const CLASES_VARIANTE: Record<Variante, string> = {
  primario: "bg-(--color-primary) text-white hover:bg-(--color-primary-dark) disabled:bg-gray-300",
  secundario:
    "border border-(--color-border) bg-white text-gray-800 hover:bg-gray-50 disabled:text-gray-400",
  peligro: "bg-(--color-danger) text-white hover:bg-red-800 disabled:bg-gray-300",
  fantasma: "text-gray-700 hover:bg-gray-100 disabled:text-gray-400",
};

export default function Boton({ variante = "primario", className = "", ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${CLASES_VARIANTE[variante]} ${className}`}
    />
  );
}
