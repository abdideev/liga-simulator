// Shared Motion (motion.dev) presets so every interaction feels the same.

import type { Transition } from "motion/react";

/** Snappy spring for hover/press feedback. */
export const RESORTE: Transition = { type: "spring", stiffness: 420, damping: 26, mass: 0.6 };

/** Softer spring for elements that slide between positions (active pills). */
export const RESORTE_SUAVE: Transition = { type: "spring", stiffness: 380, damping: 32 };

/** Press feedback for buttons and other clickable controls. */
export const PULSAR = { scale: 0.95 };
/** Hover lift for buttons. */
export const SOBRE_BOTON = { scale: 1.03 };
/** Hover lift for clickable cards. */
export const SOBRE_TARJETA = { scale: 1.02, y: -2 };
/** Hover lift for list rows (subtler, they are wide). */
export const SOBRE_FILA = { scale: 1.01 };

/** Entrance used by pages, notices and cards when they appear. */
export const APARECER = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
};
