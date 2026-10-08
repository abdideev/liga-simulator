"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { CLASES_INTENCION, type EstiloVariante, type Intencion } from "./estilos";
import { PULSAR, RESORTE, SOBRE_BOTON } from "./movimiento";

interface Props extends HTMLMotionProps<"button"> {
  intencion?: Intencion;
  variante?: EstiloVariante;
}

/** Pill button that scales up on hover and springs down when pressed. */
export default function Boton({
  intencion = "accent",
  variante = "solido",
  className = "",
  type = "button",
  disabled,
  ...props
}: Props) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : SOBRE_BOTON}
      whileTap={disabled ? undefined : PULSAR}
      transition={RESORTE}
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-[background-color,opacity] duration-150 disabled:pointer-events-none disabled:opacity-45 ${CLASES_INTENCION[intencion][variante]} ${className}`}
    />
  );
}
