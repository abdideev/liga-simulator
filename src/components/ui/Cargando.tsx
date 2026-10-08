"use client";

import { Trophy } from "lucide-react";
import { motion } from "motion/react";

/** Full-screen loading state: breathing logo plus three bouncing dots. */
export default function Cargando({ texto = "Cargando simulador" }: { texto?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas"
      role="status"
      aria-live="polite"
      data-testid="cargando"
    >
      <motion.span
        className="grid h-16 w-16 place-items-center rounded-2xl bg-ink text-paper shadow-elevada"
        animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Trophy size={28} />
      </motion.span>
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        {texto}
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-accent"
              animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
