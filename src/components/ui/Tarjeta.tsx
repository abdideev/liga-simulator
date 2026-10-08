"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { PULSAR, RESORTE, SOBRE_TARJETA } from "./movimiento";

interface Props extends HTMLMotionProps<"div"> {
  /** Clickable card (wrapped in a link): lifts on hover and springs on press. */
  interactiva?: boolean;
}

/** White surface with generous radius and a diffuse shadow instead of a border. */
export default function Tarjeta({ className = "", interactiva = false, ...props }: Props) {
  return (
    <motion.div
      whileHover={interactiva ? SOBRE_TARJETA : undefined}
      whileTap={interactiva ? { scale: PULSAR.scale + 0.03 } : undefined}
      transition={RESORTE}
      {...props}
      className={`rounded-3xl bg-paper p-5 shadow-suave sm:p-6 ${
        interactiva ? "cursor-pointer transition-shadow duration-200 hover:shadow-elevada" : ""
      } ${className}`}
    />
  );
}
