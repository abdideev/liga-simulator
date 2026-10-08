import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";

type IntencionAviso = "accent" | "ok" | "warn" | "danger";

const ESTILOS: Record<IntencionAviso, { clases: string; icono: LucideIcon }> = {
  accent: { clases: "border-accent/30 bg-accent-soft text-accent-ink", icono: Info },
  ok: { clases: "border-ok/30 bg-ok-soft text-ok-ink", icono: CheckCircle2 },
  warn: { clases: "border-warn bg-warn-soft text-warn-ink", icono: AlertTriangle },
  danger: { clases: "border-danger/30 bg-danger-soft text-danger-ink", icono: XCircle },
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  intencion?: IntencionAviso;
  icono?: LucideIcon;
}

/** Inline notice box (info, success, warning, error). */
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
    <div
      role={intencion === "danger" ? "alert" : "status"}
      {...props}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm font-medium ${clases} ${className}`}
    >
      <Icono size={18} className="mt-px shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
