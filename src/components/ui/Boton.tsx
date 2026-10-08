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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-[background-color,transform,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 ${CLASES_INTENCION[intencion][variante]} ${className}`}
    />
  );
}
