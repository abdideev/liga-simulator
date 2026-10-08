"use client";

import type { ButtonHTMLAttributes } from "react";

import { CLASES_INTENCION, type EstiloVariante, type Intencion } from "./estilos";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  intencion?: Intencion;
  variante?: EstiloVariante;
}

export default function Boton({
  intencion = "accent",
  variante = "solido",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${CLASES_INTENCION[intencion][variante]} ${className}`}
    />
  );
}
