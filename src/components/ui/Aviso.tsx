"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

import { APARECER } from "./movimiento";

type IntencionAviso = "accent" | "ok" | "warn" | "danger";

const ESTILOS: Record<IntencionAviso, { clases: string; icono: LucideIcon }> = {
  accent: { clases: "bg-accent-soft text-accent-ink", icono: Info },
  ok: { clases: "bg-ok-soft text-ok-ink", icono: CheckCircle2 },
  warn: { clases: "bg-warn-soft text-warn-ink", icono: AlertTriangle },
  danger: { clases: "bg-danger-soft text-danger-ink", icono: XCircle },
};

interface Props extends HTMLMotionProps<"div"> {
  intencion?: IntencionAviso;
  icono?: LucideIcon;
}

/** Inline notice (info, success, warning, error); fades in when it appears. */
export default function Aviso({
  intencion = "accent",
  icono,
  className = "",
  children,
  ...props
}: Props) {
  const { clases, icono: IconoBase } = ESTILOS[intencion];
  const Icono = icono ?? IconoBase;
  return (
    <motion.div
      role={intencion === "danger" ? "alert" : "status"}
      {...APARECER}
      {...props}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${clases} ${className}`}
    >
      {intencion === "danger" ? (
        // Errors get a short shake so a rejected action is noticed.
        <motion.span
          className="mt-px shrink-0"
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -12, 10, -6, 0] }}
          transition={{ duration: 0.4 }}
        >
          <Icono size={18} />
        </motion.span>
      ) : (
        <Icono size={18} className="mt-px shrink-0" />
      )}
      <div className="min-w-0 flex-1">{children as ReactNode}</div>
    </motion.div>
  );
}
